const fetch = require('node-fetch')
const { ERROR_MESSAGE, HELP_BLOCK, sendToSlack } = require('./slack-utils')

const sendTaskingManagerStats = require('./send-tm-stats')
const { sendProjectUserStats, sendUserStats } = require('./user-stats')
const sendProjectStats = require('./send-project-stats')

const containsNonDigitCharacter = (parameter) => {
  return !!parameter.match(/\D/)
}

const checkIfProjectExists = async (projectId) => {
  const projectSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/queries/summary/` // move base URL to Parameter Store
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
      await sendTaskingManagerStats(responseURL)
      return
    }

    if (commandParameters === 'help') {
      await sendToSlack(responseURL, HELP_BLOCK)
      return
    }

    const parameterHasPlus = !!commandParameters.match(/\+/)

    // token = await ssm.getParam

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
        await sendUserStats(responseURL, spacedParameters)
        return
      }

      const secondParameter = spacedParameters.slice(indexFirstSpace + 1)
      const firstParameterIsProject = await checkIfProjectExists(firstParameter)

      if (firstParameterIsProject) {
        await sendProjectUserStats(responseURL, firstParameter, secondParameter)
        return
      }
      await sendUserStats(responseURL, spacedParameters)
      return
    }

    if (containsNonDigitCharacter(commandParameters)) {
      await sendUserStats(responseURL, commandParameters)
      return
    }

    return (await checkIfProjectExists(commandParameters))
      ? await sendProjectStats(responseURL, commandParameters)
      : await sendUserStats(responseURL, commandParameters)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}
