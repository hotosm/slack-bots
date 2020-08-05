const AWS = require('aws-sdk')
const fetch = require('node-fetch')

const { ERROR_MESSAGE, HELP_BLOCK, sendToSlack } = require('./slack-utils')
const sendTaskingManagerStats = require('./send-tm-stats')
const { sendProjectUserStats, sendUserStats } = require('./user-stats')
const sendProjectStats = require('./send-project-stats')

const TM_API_BASE_URL = process.env.TM_API_BASE_URL
const TM_BASE_URL = process.env.TM_BASE_URL

const containsNonDigitCharacter = (parameter) => {
  return !!parameter.match(/\D/)
}

const checkIfProjectExists = async (projectId) => {
  const projectSummaryURL = `${TM_API_BASE_URL}projects/${projectId}/queries/summary/`
  const projectSummaryRes = await fetch(projectSummaryURL)

  if (projectSummaryRes.status >= 500) {
    throw new Error('Status 500 when calling Tasking Manager')
  }

  return projectSummaryRes.status === 200 ? true : false
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)
  const commandParameters = snsMessage.text

  try {
    if (!commandParameters) {
      await sendTaskingManagerStats(responseURL, TM_API_BASE_URL)
      return
    }

    if (commandParameters === 'help') {
      await sendToSlack(responseURL, HELP_BLOCK)
      return
    }

    const parameterHasPlus = !!commandParameters.match(/\+/)

    // TODO: Add logic to get TM token (put it in the Parameter Store after acquiring?)
    const ssmParams = {
      Name: 'tm-token',
      WithDecryption: true,
    }
    const ssmResult = await new AWS.SSM().getParameter(ssmParams).promise()
    const tmToken = ssmResult.Parameter.Value

    /*
      This logic handles the following cases
      - the command parameters contain only a user name (potentially with spaces)
      - the command parameters contain only a projectId
      - the command parameters contain a projectID then a space and then a username 
    */
    if (parameterHasPlus) {
      const spacedParameters = decodeURIComponent(
        commandParameters.replace(/\+/g, ' ')
      )
      const indexFirstSpace = spacedParameters.indexOf(' ')
      const firstParameter = spacedParameters.slice(0, indexFirstSpace)

      if (containsNonDigitCharacter(firstParameter)) {
        await sendUserStats(
          responseURL,
          tmToken,
          TM_API_BASE_URL,
          TM_BASE_URL,
          spacedParameters
        )
        return
      }

      const secondParameter = spacedParameters.slice(indexFirstSpace + 1)
      const firstParameterIsProject = await checkIfProjectExists(firstParameter)

      if (firstParameterIsProject) {
        await sendProjectUserStats(
          responseURL,
          tmToken,
          TM_API_BASE_URL,
          TM_BASE_URL,
          firstParameter,
          secondParameter
        )
        return
      }
      await sendUserStats(
        responseURL,
        tmToken,
        TM_API_BASE_URL,
        TM_BASE_URL,
        spacedParameters
      )
      return
    }

    if (containsNonDigitCharacter(commandParameters)) {
      await sendUserStats(
        responseURL,
        tmToken,
        TM_API_BASE_URL,
        TM_BASE_URL,
        commandParameters
      )
      return
    }

    return (await checkIfProjectExists(commandParameters))
      ? await sendProjectStats(
          responseURL,
          TM_API_BASE_URL,
          TM_BASE_URL,
          commandParameters
        )
      : await sendUserStats(
          responseURL,
          tmToken,
          TM_API_BASE_URL,
          TM_BASE_URL,
          commandParameters
        )
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}
