const fetch = require('node-fetch')

const { ERROR_MESSAGE, sendToSlack } = require('./slack-utils')

const sendTaskingManagerStats = async (responseURL, tmApiBaseUrl) => {
  try {
    const tmStatsURL = `${tmApiBaseUrl}system/statistics/?abbreviated=true`
    const taskingManagerStatsRes = await fetch(tmStatsURL)

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
              text: `:female-construction-worker::male-construction-worker: *Number of Mappers Online*: ${mappersOnline.toLocaleString()}`,
            },
            {
              type: 'mrkdwn',
              text: `:round_pushpin: *Number of Mappers*: ${totalMappers.toLocaleString()}`,
            },
            {
              type: 'mrkdwn',
              text: `:teamwork-dreamwork::teamwork-dreamwork: *Number of Tasks Mapped*: ${tasksMapped.toLocaleString()}`,
            },
            {
              type: 'mrkdwn',
              text: `:world_map: *Number of Projects Hosted*: ${totalProjects.toLocaleString()}`,
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
