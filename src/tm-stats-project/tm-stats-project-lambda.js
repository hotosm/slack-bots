const fetch = require('node-fetch')

const createSlackResponse = async (responseURL, messageBlock) => {
  await fetch(responseURL, {
    method: 'post',
    body: JSON.stringify({
      blocks: messageBlock,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
}

const statsTaskingManager = async (responseURL) => {
  //returns stats for the instance
}

const statsProjectUser = async (responseURL, params) => {
  // will need to separate params first
  //8272+hello+1234+4567 string
}

const statsUser = async (responseURL, user) => {
  // returns stats on user
}

const statsProject = async (responseURL, projectId) => {
  const taskingManagerSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/queries/summary/`

  const taskingManagerSummaryResponse = await fetch(taskingManagerSummaryURL)
  const taskingManagerSummaryObj = await taskingManagerSummaryResponse.json()

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

    return createSlackResponse(responseURL, errorBlock)
  }

  // Change null values in data to 'N/A' instead for readability
  for (const data in taskingManagerSummaryObj) {
    if (taskingManagerSummaryObj[data] === null) {
      taskingManagerSummaryObj[data] = 'N/A'
    }
  }

  const {
    projectInfo,
    percentMapped,
    percentValidated,
    status,
  } = taskingManagerSummaryObj

  const taskingManagerStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/`

  const taskingManagerStatsResponse = await fetch(taskingManagerStatsURL)
  const taskingManagerStatsObj = await taskingManagerStatsResponse.json()

  const { totalMappers, totalTasks } = taskingManagerStatsObj

  const projectURL = `https://tasks.hotosm.org/project/${projectId}`

  const successBlock = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${projectURL}|*${projectId} - ${projectInfo.name}*>`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${status}* - ${projectInfo.shortDescription}`,
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

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)
  const commandParams = snsMessage.text

  if (!commandParams) {
    return statsTaskingManager(responseURL)
  }

  if (commandParams.includes('+')) {
    return statsProjectUser(commandParams)
  } else {
    const commandParamsHasNonDigit = !!commandParams.match(/\D/)

    commandParamsHasNonDigit
      ? statsUser(responseURL, commandParams)
      : statsProject(responseURL, commandParams)
  }
}
