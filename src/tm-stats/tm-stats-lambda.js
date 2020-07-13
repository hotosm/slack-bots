const fetch = require('node-fetch')

const TM_STATS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/statistics/?abbreviated=true' // move base URL to Parameter Store

const TM_REQUEST_HEADER = {
  headers: {
    'Content-Type': 'application/json',
    Authorization:
      'Token TVRBNE9UUTNNalEuWHdQb2RBLnExRHJmZERPZ2NLSXJ6Vk45bmNxckFuV0xfVQ==', // change this with parameter store value
  },
}

const throwError = (message) => {
  throw new Error(message)
}

const ERROR_MESSAGE = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>', // move to Parameter Store so it can be used for all generic errors?
}

const USER_ERROR_BLOCK = {
  response_type: 'ephemeral',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':x: Please check that the project ID / username is correct.\nUse the `/tm-stats help` command for additional information.',
      },
    },
  ],
}

const HELP_BLOCK = {
  response_type: 'ephemeral',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'The `/tm-stats` command will return different information depending on what you input:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats` for stats on the Tasking Manager home page',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats [projectID]` for stats on a Tasking Manager project (e.g. `/tm-stats 8172`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats [username]` for stats on a user (e.g. `/tm-stats Charlie Brown`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats [projectID username]` for stats on user contribution in a Tasking Manager project (e.g. `/tm-stats 8172 Charlie Brown`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'If you need more help, post a message at <#C319P09PB>',
      },
    },
  ],
}

const containsNonDigit = (parameter) => {
  return !!parameter.match(/\D/)
}

const transformSecondsToDHMS = (time) => {
  time = Number(time)

  if (time === 0) {
    return '0 time'
  }

  const days = Math.floor(time / (3600 * 24))
  const hours = Math.floor((time % (3600 * 24)) / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = Math.floor(time % 60)

  const daysDisplay = days > 0 ? days + (days == 1 ? ' day ' : ' days ') : ''
  const hoursDisplay =
    hours > 0 ? hours + (hours == 1 ? ' hour ' : ' hours ') : ''
  const minutesDisplay =
    minutes > 0 ? minutes + (minutes == 1 ? ' minute ' : ' minutes ') : ''
  const secondsDisplay =
    seconds > 0 ? seconds + (seconds == 1 ? ' second' : ' seconds') : ''

  return daysDisplay + hoursDisplay + minutesDisplay + secondsDisplay
}

const sendToSlack = async (responseURL, message) => {
  await fetch(responseURL, {
    method: 'post',
    body: JSON.stringify(message),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

const projectExists = async (responseURL, projectId) => {
  const projectSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/queries/summary/` // move base URL to Parameter Store
  const projectSummaryRes = await fetch(projectSummaryURL)

  if (projectSummaryRes.status >= 500) {
    throwError('Status 500 when calling Tasking Manager')
    return
  }

  return projectSummaryRes.status === 200 ? true : false
}

const statsProject = async (responseURL, projectId) => {
  try {
    const projectSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/queries/summary/` // move base URL to Parameter Store
    const projectStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/` // move base URL to Parameter Store

    const [projectSummaryRes, projectStatsRes] = await Promise.all([
      fetch(projectSummaryURL),
      fetch(projectStatsURL),
    ])

    if (projectSummaryRes.status != 200 || projectStatsRes.status != 200) {
      throwError('Cannot get project information from Tasking Manager')
      return
    }

    const [
      { projectInfo, percentMapped, percentValidated, status },
      { 'projectArea(in sq.km)': projectArea, totalMappers, totalTasks },
    ] = await Promise.all([projectSummaryRes.json(), projectStatsRes.json()])

    const projectURL = `https://tasks.hotosm.org/project/${projectId}` // move base URL to Parameter Store

    const projectStatsBlock = {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${projectURL}|*${projectId} - ${projectInfo.name}*>`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${status}* - ${projectInfo.shortDescription}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:world_map: *Project Area* - ${projectArea}} sq. km.`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:female-construction-worker::male-construction-worker: *Number of Contributors*: ${totalMappers}`,
            },
            {
              type: 'mrkdwn',
              text: `:clipboard: *Number of Tasks*: ${totalTasks}`,
            },
            {
              type: 'mrkdwn',
              text: `:round_pushpin: *${percentMapped}%* Mapped`,
            },
            {
              type: 'mrkdwn',
              text: `:white_check_mark: *${percentValidated}%* Validated`,
            },
          ],
        },
      ],
    }

    await sendToSlack(responseURL, projectStatsBlock)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

const statsProjectUser = async (responseURL, projectId, userName) => {
  try {
    const projectUserStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/queries/${encodeURIComponent(
      userName
    )}/` // move base URL to Parameter Store
    const projectURL = `https://tasks.hotosm.org/project/${projectId}` // move base URL to Parameter Store

    const projectUserStatsRes = await fetch(
      projectUserStatsURL,
      TM_REQUEST_HEADER
    )

    if (projectUserStatsRes.status != 200) {
      const { Error } = await projectUserStatsRes.json()

      throwError(Error)
      return
    }

    const {
      timeSpentMapping,
      timeSpentValidating,
      totalTimeSpent,
    } = await projectUserStatsRes.json()

    const projectUserStatsBlock = {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `User *${userName}* has spent *${transformSecondsToDHMS(
              totalTimeSpent
            )}* contributing to <${projectURL}|project ${projectId}>:`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:round_pushpin: ${transformSecondsToDHMS(
                timeSpentMapping
              )} mapping`,
            },
            {
              type: 'mrkdwn',
              text: `:white_check_mark: ${transformSecondsToDHMS(
                timeSpentValidating
              )} validating`,
            },
          ],
        },
      ],
    }

    await sendToSlack(responseURL, projectUserStatsBlock)
  } catch (error) {
    console.error(error)

    if (error.message === 'User not found') {
      await sendToSlack(responseURL, USER_ERROR_BLOCK)
      return
    }

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

const statsTaskingManager = async (responseURL) => {
  try {
    const taskingManagerStatsRes = await fetch(TM_STATS_URL)

    if (taskingManagerStatsRes.status != 200) {
      throwError('Cannot get Tasking Manager home page stats')
      return
    }

    const {
      mappersOnline,
      tasksMapped,
      totalMappers,
      totalProjects,
    } = await taskingManagerStatsRes.json()

    const taskingManagerStatsBlock = {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:female-construction-worker::male-construction-worker: *Number of Mappers Online*: ${mappersOnline}`,
            },
            {
              type: 'mrkdwn',
              text: `:round_pushpin: *Number of Mappers*: ${totalMappers}`,
            },
            {
              type: 'mrkdwn',
              text: `:teamwork-dreamwork::teamwork-dreamwork: *Number of Tasks Mapped*: ${tasksMapped}`,
            },
            {
              type: 'mrkdwn',
              text: `:world_map: *Number of Projects Hosted*: ${totalProjects}`,
            },
          ],
        },
      ],
    }

    await sendToSlack(responseURL, taskingManagerStatsBlock)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

const statsUser = async (responseURL, userName) => {
  try {
    const userStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/users/${encodeURIComponent(
      userName
    )}/statistics/` // move base URL to Parameter Store

    const userStatsRes = await fetch(userStatsURL, TM_REQUEST_HEADER)

    if (userStatsRes.status != 200) {
      if (userStatsRes.status >= 400 && userStatsRes.status < 500) {
        throwError('User cannot be found or accessed')
        return
      }

      throwError('Cannot get user stats from Tasking Manager')
      return
    }

    const {
      totalTimeSpent,
      timeSpentMapping,
      timeSpentValidating,
      projectsMapped,
      tasksMapped,
      tasksValidated,
      tasksInvalidated,
      tasksInvalidatedByOthers,
      tasksValidatedByOthers,
    } = await userStatsRes.json()

    const userTmURL = `https://tasks.hotosm.org/users/${encodeURIComponent(
      userName
    )}`

    const userStatsBlock = {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:star2: *User <${userTmURL}|${userName}> has mapped ${projectsMapped} project(s)* :star2:`, // move to Parameter Store
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `They have spent *${transformSecondsToDHMS(
              totalTimeSpent
            )}* in total contributing to the community`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:mantelpiece_clock: *${transformSecondsToDHMS(
                timeSpentMapping
              )}* mapping`,
            },
            {
              type: 'mrkdwn',
              text: `:mantelpiece_clock: *${transformSecondsToDHMS(
                timeSpentValidating
              )}* validating`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:round_pushpin: They have mapped *${tasksMapped} tasks* :round_pushpin:`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:white_check_mark: Validated *${tasksValidated} tasks*`,
            },
            {
              type: 'mrkdwn',
              text: `:negative_squared_cross_mark: Invalidated *${tasksInvalidated} tasks*`,
            },
            {
              type: 'mrkdwn',
              text: `:heavy_check_mark: Had *${tasksValidatedByOthers} tasks* validated by others`,
            },
            {
              type: 'mrkdwn',
              text: `:heavy_multiplication_x: Had *${tasksInvalidatedByOthers} tasks* invalidated by others`,
            },
          ],
        },
      ],
    }

    await sendToSlack(responseURL, userStatsBlock)
  } catch (error) {
    console.error(error)

    if (error.message === 'User cannot be found or accessed') {
      await sendToSlack(responseURL, USER_ERROR_BLOCK)
      return
    }

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)
  const commandParameters = snsMessage.text

  try {
    if (!commandParameters) {
      await statsTaskingManager(responseURL)
      return
    }

    if (commandParameters === 'help') {
      await sendToSlack(responseURL, HELP_BLOCK)
      return
    }

    const parameterHasSpace = !!commandParameters.match(/\+/) // Message payload has '+' in lieu of spaces

    if (parameterHasSpace) {
      const spacedParameters = decodeURIComponent(
        commandParameters.replace(/\+/g, ' ')
      )
      const indexFirstSpace = spacedParameters.indexOf(' ')
      const firstParameter = spacedParameters.slice(0, indexFirstSpace)

      if (containsNonDigit(firstParameter)) {
        await statsUser(responseURL, spacedParameters)
        return
      }

      const secondParameter = spacedParameters.slice(indexFirstSpace + 1)

      return (await projectExists(responseURL, firstParameter))
        ? await statsProjectUser(responseURL, firstParameter, secondParameter)
        : await statsUser(responseURL, spacedParameters)
    }

    if (containsNonDigit(commandParameters)) {
      await statsUser(responseURL, commandParameters)
      return
    }

    return (await projectExists(responseURL, commandParameters))
      ? await statsProject(responseURL, commandParameters)
      : await statsUser(responseURL, commandParameters)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}
