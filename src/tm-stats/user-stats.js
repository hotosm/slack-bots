const fetch = require('node-fetch')

const {
  ERROR_MESSAGE,
  USER_ERROR_BLOCK,
  sendToSlack,
} = require('./slack-utils')

const SECONDS_IN_HOUR = 3600
const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24

const formatElapsedTime = (secondsElapsed) => {
  secondsElapsed = Number(secondsElapsed)

  if (secondsElapsed === 0) {
    return '0 time'
  }

  const days = Math.floor(secondsElapsed / SECONDS_IN_DAY)
  const hours = Math.floor((secondsElapsed % SECONDS_IN_DAY) / SECONDS_IN_HOUR)
  const minutes = Math.floor((secondsElapsed % SECONDS_IN_HOUR) / 60)
  const seconds = Math.floor(secondsElapsed % 60)

  let formattedTime = ''

  if (days) {
    formattedTime += `${days} day${days == 1 ? '' : 's'} `
  }

  if (hours) {
    formattedTime += `${hours} hour${hours == 1 ? '' : 's'} `
  }

  if (minutes) {
    formattedTime += `${minutes} minute${minutes == 1 ? '' : 's'} `
  }

  if (seconds) {
    formattedTime += `${seconds} second${seconds == 1 ? '' : 's'}`
  }

  return formattedTime
}

// TODO: make this a function buildTmRequestHeader(token)
const TM_REQUEST_HEADER = {
  headers: {
    'Content-Type': 'application/json',
    Authorization:
      'Token TVRBNE9UUTNNalEuWHdQb2RBLnExRHJmZERPZ2NLSXJ6Vk45bmNxckFuV0xfVQ==', // change this with parameter store value
  },
}

const sendUserStats = async (responseURL, userName) => {
  // TODO: take token as param
  try {
    const userStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/users/${encodeURIComponent(
      userName
    )}/statistics/` // move base URL to Parameter Store

    const userStatsRes = await fetch(userStatsURL, TM_REQUEST_HEADER)

    if (userStatsRes.status !== 200) {
      if (userStatsRes.status >= 400 && userStatsRes.status < 500) {
        throw new Error('User cannot be found or accessed')
      }

      throw new Error('Cannot get user stats from Tasking Manager')
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
            text: `:star2: *User <${userTmURL}|${userName}> has mapped ${projectsMapped} project(s)* :star2:`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `They have spent *${formatElapsedTime(
              totalTimeSpent
            )}* in total contributing to the community`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:mantelpiece_clock: *${formatElapsedTime(
                timeSpentMapping
              )}* mapping`,
            },
            {
              type: 'mrkdwn',
              text: `:mantelpiece_clock: *${formatElapsedTime(
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

const sendProjectUserStats = async (responseURL, projectId, userName) => {
  // TODO: take token as param
  try {
    const projectUserStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/queries/${encodeURIComponent(
      userName
    )}/` // move base URL to Parameter Store
    const projectURL = `https://tasks.hotosm.org/project/${projectId}` // move base URL to Parameter Store

    const projectUserStatsRes = await fetch(
      projectUserStatsURL,
      TM_REQUEST_HEADER
    )

    if (projectUserStatsRes.status !== 200) {
      const { Error } = await projectUserStatsRes.json()

      throw new Error(Error)
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
            text: `User *${userName}* has spent *${formatElapsedTime(
              totalTimeSpent
            )}* contributing to <${projectURL}|project ${projectId}>:`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:round_pushpin: ${formatElapsedTime(
                timeSpentMapping
              )} mapping`,
            },
            {
              type: 'mrkdwn',
              text: `:white_check_mark: ${formatElapsedTime(
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

module.exports = { sendProjectUserStats, sendUserStats }
