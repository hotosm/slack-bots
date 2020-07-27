const fetch = require('node-fetch')

const { ERROR_MESSAGE, sendToSlack } = require('./slack-utils')

const TM_STATS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/statistics/?abbreviated=true' // move base URL to Parameter Store

const sendTaskingManagerStats = async (responseURL) => {
  try {
    const taskingManagerStatsRes = await fetch(TM_STATS_URL)

    if (taskingManagerStatsRes.status !== 200) {
      throw new Error('Cannot get Tasking Manager home page stats')
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

module.exports = sendTaskingManagerStats
