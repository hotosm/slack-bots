const fetch = require('node-fetch')

const utils = require('./slack-utils')

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

const buildTmRequestHeader = (token) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
  }
}

const sendUserStats = async (
  responseURL,
  tmToken,
  tmApiBaseUrl,
  tmBaseUrl,
  userName
) => {
  try {
    const userStatsURL = `${tmApiBaseUrl}users/${encodeURIComponent(
      userName
    )}/statistics/`

    const TM_REQUEST_HEADER = buildTmRequestHeader(tmToken)
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

    const userTmURL = `${tmBaseUrl}users/${encodeURIComponent(userName)}`

    const userStatsBlock = {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:star2: *User <${userTmURL}|${userName}> has mapped ${projectsMapped.toLocaleString()} project(s)* :star2:`,
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
            text: `:round_pushpin: They have mapped *${tasksMapped.toLocaleString()} tasks* :round_pushpin:`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `:white_check_mark: Validated *${tasksValidated.toLocaleString()} tasks*`,
            },
            {
              type: 'mrkdwn',
              text: `:negative_squared_cross_mark: Invalidated *${tasksInvalidated.toLocaleString()} tasks*`,
            },
            {
              type: 'mrkdwn',
              text: `:heavy_check_mark: Had *${tasksValidatedByOthers.toLocaleString()} tasks* validated by others`,
            },
            {
              type: 'mrkdwn',
              text: `:heavy_multiplication_x: Had *${tasksInvalidatedByOthers.toLocaleString()} tasks* invalidated by others`,
            },
          ],
        },
      ],
    }

    await utils.sendToSlack(responseURL, userStatsBlock)
  } catch (error) {
    console.error(error)

    if (error.message === 'User cannot be found or accessed') {
      await utils.sendToSlack(responseURL, utils.USER_ERROR_BLOCK)
      return
    }

    await utils.sendToSlack(responseURL, utils.ERROR_MESSAGE)
  }
}

const sendProjectUserStats = async (
  responseURL,
  tmToken,
  tmApiBaseUrl,
  tmBaseUrl,
  projectId,
  userName
) => {
  try {
    const projectUserStatsURL = `${tmApiBaseUrl}projects/${projectId}/statistics/queries/${encodeURIComponent(
      userName
    )}/`
    const projectURL = `${tmBaseUrl}project/${projectId}`

    const TM_REQUEST_HEADER = buildTmRequestHeader(tmToken)
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

    await utils.sendToSlack(responseURL, projectUserStatsBlock)
  } catch (error) {
    console.error(error)

    if (error.message === 'User not found') {
      await utils.sendToSlack(responseURL, utils.USER_ERROR_BLOCK)
      return
    }

    await utils.sendToSlack(responseURL, utils.ERROR_MESSAGE)
  }
}

module.exports = { sendProjectUserStats, sendUserStats }
