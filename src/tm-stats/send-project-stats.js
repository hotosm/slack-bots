const fetch = require('node-fetch')

const { ERROR_MESSAGE, sendToSlack } = require('./slack-utils')

const sendProjectStats = async (responseURL, projectId) => {
  try {
    const projectSummaryURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/queries/summary/` // move base URL to Parameter Store
    const projectStatsURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/statistics/` // move base URL to Parameter Store

    const [projectSummaryRes, projectStatsRes] = await Promise.all([
      fetch(projectSummaryURL),
      fetch(projectStatsURL),
    ])

    if (projectSummaryRes.status !== 200 || projectStatsRes.status !== 200) {
      throw new Error('Cannot get project information from Tasking Manager')
    }

    const [
      { projectInfo, percentMapped, percentValidated, status },
      { 'projectArea(in sq.km)': projectArea, totalMappers, totalTasks },
    ] = await Promise.all([projectSummaryRes.json(), projectStatsRes.json()])

    const projectURL = `https://tasks.hotosm.org/project/${projectId}` // move base URL to Parameter Store

    const projectStatsBlock = {
      response_type: 'ephemeral',
      blocks: [
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
            text: `:world_map: *Project Area* - ${projectArea}} sq. km.`,
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
              text: `:female-construction-worker::male-construction-worker: *Number of Contributors*: ${totalMappers}`,
            },
            {
              type: 'mrkdwn',
              text: `:clipboard: *Number of Tasks*: ${totalTasks}`,
            },
            {
              type: 'mrkdwn',
              text: `:round_pushpin: *${percentMapped}%* Mapped`,
            },
            {
              type: 'mrkdwn',
              text: `:white_check_mark: *${percentValidated}%* Validated`,
            },
          ],
        },
      ],
    }

    await sendToSlack(responseURL, projectStatsBlock)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

module.exports = sendProjectStats
