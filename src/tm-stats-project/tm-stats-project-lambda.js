const fetch = require('node-fetch')

const TM_REQUEST_HEADER = {
  headers: {
    'Content-Type': 'application/json',
    Authorization:
      'Token TVRBNE9UUTNNalEuWHdQb2RBLnExRHJmZERPZ2NLSXJ6Vk45bmNxckFuV0xfVQ==', //change this with parameter store value
  },
}

const ERROR_MESSAGE =
  'Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>'

const containsNonDigit = (parameter) => {
  return !!parameter.match(/\D/)
}

const projectExists = async (responseURL, projectId) => {
  const projectSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/queries/summary/`
  const projectSummaryResponse = await fetch(projectSummaryURL)

  if (projectSummaryResponse.status === 500) {
    return await fetch(responseURL, {
      method: 'post',
      body: ERROR_MESSAGE,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return projectSummaryResponse.status === 200 ? true : false
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

const createSlackResponse = async (responseURL, messageBlock) => {
  try {
    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify({
        blocks: messageBlock,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: ERROR_MESSAGE,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

const userErrorMessage = (responseURL) => {
  const errorBlock = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':x: Please check that the project ID / username is correct.\nUse the `/tm-stats help` command for additional information',
      },
    },
  ]

  return createSlackResponse(responseURL, errorBlock)
}

const helpMessage = (responseURL) => {
  const helpBlock = [
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
  ]

  return createSlackResponse(responseURL, helpBlock)
}

const statsProject = async (responseURL, projectId) => {
  console.log('STATS PROJECT')

  try {
    const projectSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/queries/summary/`
    const projectSummaryResponse = await fetch(projectSummaryURL)
    const projectSummary = await projectSummaryResponse.json()

    const {
      projectInfo,
      percentMapped,
      percentValidated,
      status,
    } = projectSummary

    const projectStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/`

    const projectStatsResponse = await fetch(projectStatsURL)
    const projectStats = await projectStatsResponse.json()

    const { totalMappers, totalTasks } = projectStats

    const projectURL = `https://tasks.hotosm.org/project/${projectId}`

    const projectStatsBlock = [
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
          text: `*Project Area* - ${projectStats['projectArea(in sq.km)']} sq. km.`,
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
            text: `*Number of Contributors*: ${totalMappers}`,
          },
          {
            type: 'mrkdwn',
            text: `*Number of Tasks*: ${totalTasks}`,
          },
          {
            type: 'mrkdwn',
            text: `*${percentMapped}%* Mapped`,
          },
          {
            type: 'mrkdwn',
            text: `*${percentValidated}%* Validated`,
          },
        ],
      },
    ]

    return createSlackResponse(responseURL, projectStatsBlock)
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: ERROR_MESSAGE,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

const statsProjectUser = async (responseURL, projectId, userName) => {
  console.log('STATS PROJECT USER')

  try {
    const projectUserStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/queries/${encodeURIComponent(
      userName
    )}/`
    const projectURL = `https://tasks.hotosm.org/project/${projectId}`

    const projectUserStatsResponse = await fetch(
      projectUserStatsURL,
      TM_REQUEST_HEADER
    )
    const projectUserStats = await projectUserStatsResponse.json()

    if (projectUserStats.Error) {
      return userErrorMessage(responseURL)
    }

    const {
      timeSpentMapping: secondsSpentMapping,
      timeSpentValidating: secondsSpentValidating,
      totalTimeSpent: secondsTotalTimeSpent,
    } = projectUserStats

    const projectUserStatsBlock = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `User *${userName}* has spent *${transformSecondsToDHMS(
            secondsTotalTimeSpent
          )}* contributing to <${projectURL}|project ${projectId}>:`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `:round_pushpin: ${transformSecondsToDHMS(
              secondsSpentMapping
            )} mapping`,
          },
          {
            type: 'mrkdwn',
            text: `:white_check_mark: ${transformSecondsToDHMS(
              secondsSpentValidating
            )} validating`,
          },
        ],
      },
    ]

    return createSlackResponse(responseURL, projectUserStatsBlock)
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: ERROR_MESSAGE,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

const statsTaskingManager = async (responseURL) => {
  try {
    const TM_STATS_URL =
      'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/statistics/?abbreviated=true'

    const taskingManagerStatsResponse = await fetch(TM_STATS_URL)
    const {
      mappersOnline,
      tasksMapped,
      totalMappers,
      totalProjects,
    } = await taskingManagerStatsResponse.json()

    const taskingManagerStatsBlock = [
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `:female-construction-worker::male-construction-worker:*Number of Mappers Online*: ${mappersOnline}`,
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
    ]

    return createSlackResponse(responseURL, taskingManagerStatsBlock)
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: ERROR_MESSAGE,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

const statsUser = async (responseURL, userName) => {
  console.log('STATS USER')

  try {
    const userStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/users/${encodeURIComponent(
      userName
    )}/statistics/`

    const userStatsResponse = await fetch(userStatsURL, TM_REQUEST_HEADER)
    const userStats = await userStatsResponse.json()

    if (userStats.Error) {
      return userErrorMessage(responseURL)
    }

    const {
      totalTimeSpent: secondsTotalTimeSpent,
      timeSpentMapping: secondsSpentMapping,
      timeSpentValidating: secondsSpentValidating,
      projectsMapped,
      tasksMapped,
      tasksValidated,
      tasksInvalidated,
      tasksInvalidatedByOthers,
      tasksValidatedByOthers,
    } = userStats

    const userStatsBlock = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:star2: *User ${userName} has mapped ${projectsMapped} project(s)* :star2:`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `They have spent *${transformSecondsToDHMS(
            secondsTotalTimeSpent
          )}* in total contributing to the community`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `:mantelpiece_clock: *${transformSecondsToDHMS(
              secondsSpentMapping
            )}* mapping`,
          },
          {
            type: 'mrkdwn',
            text: `:mantelpiece_clock: *${transformSecondsToDHMS(
              secondsSpentValidating
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
    ]

    return createSlackResponse(responseURL, userStatsBlock)
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: ERROR_MESSAGE,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)
  const commandParameters = snsMessage.text

  if (!commandParameters) {
    return await statsTaskingManager(responseURL)
  }

  if (commandParameters === 'help') {
    return helpMessage(responseURL)
  }

  const parameterHasSpace = !!commandParameters.match(/\+/)

  if (parameterHasSpace) {
    const spacedParameters = decodeURIComponent(
      commandParameters.replace(/\+/g, ' ')
    )
    const indexFirstSpace = spacedParameters.indexOf(' ')
    const firstParameter = spacedParameters.slice(0, indexFirstSpace)

    if (containsNonDigit(firstParameter)) {
      return await statsUser(responseURL, spacedParameters)
    }

    const secondParameter = spacedParameters.slice(indexFirstSpace + 1)

    return (await projectExists(responseURL, firstParameter))
      ? await statsProjectUser(responseURL, firstParameter, secondParameter)
      : await statsUser(responseURL, spacedParameters)
  }

  if (containsNonDigit(commandParameters)) {
    return await statsUser(responseURL, commandParameters)
  }

  return (await projectExists(responseURL, commandParameters))
    ? await statsProject(responseURL, commandParameters)
    : await statsUser(responseURL, commandParameters)
}
