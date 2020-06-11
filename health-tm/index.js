const fetch = require('node-fetch')

const TM_STATUS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/heartbeat/'

const TM_STATISTICS_URL =
  'https://tasking-manager-tm4-production-api.hotosm.org/api/v2/system/statistics/?abbreviated=true'

const parseEvent = (event) => {
  const snsJSON = JSON.stringify(event.Records[0].Sns)
  console.log(`snsJSON: ${snsJSON}`)
  const snsObject = JSON.parse(snsJSON)
  console.log(`snsObject: ${snsObject}`)
  const decodedSns = JSON.parse(decodeURIComponent(snsObject.Message))
  console.log(`decodedSns: ${decodedSns}`)

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
            ? ':white_check_mark: The Tasking Manager is operational'
            : ':heavy_exclamation_mark: The Tasking Manager cannot be reached',
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `Number of Mappers Online: ${mappersOnline}`,
        },
        {
          type: 'mrkdwn',
          text: `Number of Projects Hosted: ${totalProjects}`,
        },
      ],
    },
  ]
}

exports.handler = async (event) => {
  const body = parseEvent(event)
  const responseURL = body.response_url

  try {
    const taskingManagerStatus = await fetch(TM_STATUS_URL)
    const statusJSON = await taskingManagerStatus.json()
    const status = statusJSON.status

    const taskingManagerStatistics = await fetch(TM_STATISTICS_URL)
    const statisticsJSON = await taskingManagerStatistics.json()
    const { mappersOnline, totalProjects } = statisticsJSON

    const slackMessage = {
      response_type: 'ephemeral',
      blocks: createBlock(status, mappersOnline, totalProjects),
    }

    fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(slackMessage),
      headers: { 'Content-Type': 'application/json' },
    })

    return {
      statusCode: 200,
    }
  } catch (error) {
    console.error(error)

    fetch(responseURL, {
      method: 'post',
      body: JSON.stringify('Something went wrong with your request'),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
