const fetch = require('node-fetch')

const TM_STATUS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/heartbeat/'

const TM_STATISTICS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/statistics/?abbreviated=true'

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
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)

  try {
    const [tmStatusResult, tmStatisticsResult] = await Promise.all([
      fetch(TM_STATUS_URL),
      fetch(TM_STATISTICS_URL),
    ])
    const [{ status }, { mappersOnline, totalProjects }] = await Promise.all([
      tmStatusResult.json(),
      tmStatisticsResult.json(),
    ])

    const slackMessage = {
      response_type: 'ephemeral',
      blocks: createBlock(status, mappersOnline, totalProjects),
    }

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(slackMessage),
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: 'Something went wrong with your request',
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
