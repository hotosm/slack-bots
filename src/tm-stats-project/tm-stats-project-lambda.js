const fetch = require('node-fetch')

const parseEvent = (event) => {
  const snsJSON = JSON.stringify(event.Records[0].Sns)
  const snsObject = JSON.parse(snsJSON)
  const decodedSns = JSON.parse(decodeURIComponent(snsObject.Message))

  return decodedSns
}

const createSlackResponse = (responseURL, messageBlock) => {
  await fetch(responseURL, {
    method: 'post',
    body: JSON.stringify({
      blocks: messageBlock,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

exports.handler = async (event) => {
  const body = parseEvent(event)
  const responseURL = body.response_url

  const projectIdHasNonDigit = !!projectID.match(/\D/)
  if (projectIdHasNonDigit) {
    const invalidIdBlock = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':x: Invalid project ID',
        },
      },
    ]
    return createSlackResponse(responseURL, invalidIdBlock)
  }

  const taskingManagerSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectID}/queries/summary/`

  const taskingManagerSummaryJSON = await fetch(taskingManagerSummaryURL)
  const taskingManagerSummaryObj = await taskingManagerSummaryJSON.json()

  if (taskingManagerSummaryObj.Error) {
    const errorBlock = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:x: ${taskingManagerSummaryObj.Error}`,
        },
      },
    ]

    return createSlackResponse(errorBlock)
  }

  // Change null values in data to 'N/A' instead for readability
  for (const data in taskingManagerSummaryObj) {
    if (taskingManagerSummaryObj[data] === null) {
      taskingManagerSummaryObj[data] = 'N/A'
    }
  }

  const {
    projectId,
    name,
    projectInfo,
    percentMapped,
    percentValidated,
    status,
  } = taskingManagerSummaryObj

  const taskingManagerStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/`

  const taskingManagerStatsJSON = await fetch(taskingManagerStatsURL)
  const taskingManagerStatsObj = await fetch(taskingManagerStatsJSON)

  const {
    totalMappers,
    totalTasks,
  } = taskingManagerStatsObj

  const projectURL = `https://tasks.hotosm.org/project/${projectID}`

  const successBlock = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${projectURL}|*${projectId} - ${name}*>`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Project Area* - ${taskingManagerStatsObj['projectArea(in sq.km)']} sq. km.`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${status}* - ${projectInfo.shortDescription}`,
      },
    }
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Number of Contributors*: ${totalMappers}`,
        },
        {
          type: 'mrkdwn',
          text: `*Number of Tasks*: ${totalTasks}`,
        },
        {
          type: 'mrkdwn',
          text: `*${percentMapped}%* Mapped`,
        },
        {
          type: 'mrkdwn',
          text: `*${percentValidated}%* Validated`,
        },
      ],
    },
  ]

  return createSlackResponse(responseURL, successBlock)
}