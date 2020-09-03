const fetch = require('node-fetch')

const TM_API_BASE_URL = process.env.TM_API_BASE_URL

const TM_STATUS_URL = TM_API_BASE_URL + 'system/heartbeat/'
const TM_STATISTICS_URL =
  TM_API_BASE_URL + 'system/statistics/?abbreviated=true'

const TM_ERROR_BLOCK = {
  response_type: 'ephemeral',
  text:
    ':heavy_exclamation_mark: The Tasking Manager cannot be reached right now. Please try again and if the error persists, post a message at <#C319P09PB>',
}

const ERROR_BLOCK = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
}

const buildSuccessBlock = (mappersOnline, totalProjects) => {
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
            text: `:female-construction-worker::male-construction-worker:*Number of Mappers Online*: ${mappersOnline.toLocaleString()}`,
          },
          {
            type: 'mrkdwn',
            text: `:world_map: *Number of Projects Hosted*: ${totalProjects.toLocaleString()}`,
          },
        ],
      },
    ],
  }
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

    if (tmStatusRes.status !== 200 || tmStatisticsRes.status !== 200) {
      await sendToSlack(responseURL, TM_ERROR_BLOCK)
      return
    }

    const { mappersOnline, totalProjects } = await tmStatisticsRes.json()

    const slackMessage = buildSuccessBlock(mappersOnline, totalProjects)

    await sendToSlack(responseURL, slackMessage)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_BLOCK)
  }
}
