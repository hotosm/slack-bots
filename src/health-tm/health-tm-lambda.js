const fetch = require('node-fetch')

const TM_STATUS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/heartbeat/'

const TM_STATISTICS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/statistics/?abbreviated=true'

const successBlock = (mappersOnline, totalProjects) => {
  return {
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':white_check_mark: *The Tasking Manager is operational*',
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
    ],
  }
}

const serverErrorBlock = {
  response_type: 'ephemeral',
  text:
    ':heavy_exclamation_mark: The Tasking Manager cannot be reached right now. Please try again and if the error persists, post a message at <#C319P09PB>',
}

const errorBlock = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
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

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)

  try {
    const [tmStatusRes, tmStatisticsRes] = await Promise.all([
      fetch(TM_STATUS_URL),
      fetch(TM_STATISTICS_URL),
    ])

    if (tmStatusRes.status != 200 || tmStatisticsRes.status != 200) {
      await sendToSlack(responseURL, serverErrorBlock)
      return
    }

    const { mappersOnline, totalProjects } = await tmStatisticsRes.json()

    const slackMessage = successBlock(mappersOnline, totalProjects)

    await sendToSlack(responseURL, slackMessage)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, errorBlock)
  }
}
