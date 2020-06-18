const fetch = require('node-fetch')

const TM_STATUS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/heartbeat/'

const TM_STATISTICS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/statistics/?abbreviated=true'

const parseEvent = (event) => {
  const snsJSON = JSON.stringify(event.Records[0].Sns)
  const snsObject = JSON.parse(snsJSON)
  const decodedSns = JSON.parse(decodeURIComponent(snsObject.Message))

  return decodedSns
}

const createBlock = (status, mappersOnline, totalProjects) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          status === 'healthy'
            ? ':white_check_mark: *The Tasking Manager is operational*'
            : ':heavy_exclamation_mark: *The Tasking Manager cannot be reached*',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `:female-construction-worker::male-construction-worker:*Number of Mappers Online*: ${mappersOnline}`,
        },
        {
          type: 'mrkdwn',
          text: `:world_map: *Number of Projects Hosted*: ${totalProjects}`,
        },
      ],
    },
  ]
}

exports.handler = async (event) => {
  const body = parseEvent(event)
  const responseURL = body.response_url
  const { channel_name } = body

  try {
    const taskingManagerStatusJSON = await fetch(TM_STATUS_URL)
    const taskingManagerObj = await taskingManagerStatusJSON.json()
    const status = taskingManagerObj.status

    const taskingManagerStatisticsJSON = await fetch(TM_STATISTICS_URL)
    const taskingManagerStatisticsObj = await taskingManagerStatisticsJSON.json()
    const { mappersOnline, totalProjects } = taskingManagerStatisticsObj

    const slackMessage = {
      response_type: 'ephemeral',
      blocks: createBlock(status, mappersOnline, totalProjects, channel_name),
    }

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(slackMessage),
      headers: { 'Content-Type': 'application/json' },
    })

    return {
      statusCode: 200,
    }
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify('Something went wrong with your request'),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
