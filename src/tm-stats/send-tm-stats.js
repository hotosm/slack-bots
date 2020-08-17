const fetch = require('node-fetch')

const utils = require('./slack-utils')

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

    await utils.sendToSlack(responseURL, taskingManagerStatsBlock)
  } catch (error) {
    console.error(error)

    await utils.sendToSlack(responseURL, utils.ERROR_MESSAGE)
  }
}

exports.default = sendTaskingManagerStats
