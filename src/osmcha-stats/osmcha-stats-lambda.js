const fetch = require('node-fetch')

const {
  createBlock,
  sendToSlack,
  ERROR_MESSAGE,
  HELP_BLOCK,
} = require('./slack-utils')

const lastMonthUnixTime = new Date(Date.now() - 2592000000).toISOString()

const OSMCHA_REQUEST_HEADER = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Token b0f566a5e9113e293a8a2a753af74d59106b4517', //change this with parameter store value
  },
}

const getFilterArray = (filter) => {
  return [
    {
      label: filter,
      value: filter,
    },
  ]
}

const BASE_URL = 'https://osmcha.org/'
const AREA_LT_VALUE = 2
const createOsmChaUrl = ({ aoiBBOX, changesetComment, dateCreated }) => {
  const filters = {
    ...(aoiBBOX ? { in_bbox: getFilterArray(aoiBBOX) } : {}),
    ...(aoiBBOX ? { area_lt: getFilterArray(AREA_LT_VALUE) } : {}),
    ...(dateCreated
      ? { date__gte: getFilterArray(dateCreated) }
      : { date__gte: getFilterArray('') }),
    ...(changesetComment ? { comment: getFilterArray(changesetComment) } : {}),
  }

  return `${BASE_URL}?filters=${encodeURIComponent(JSON.stringify(filters))}`
}

const fetchChagesetData = async (osmChaSuspectURL, osmChaStatsURL) => {
  const [osmChaSuspectRes, osmChaStatsRes] = await Promise.all([
    fetch(osmChaSuspectURL, OSMCHA_REQUEST_HEADER),
    fetch(osmChaStatsURL, OSMCHA_REQUEST_HEADER),
  ])

  const { status: suspectStatus } = osmChaSuspectRes
  const { status: statsStatus } = osmChaStatsRes

  const [{ count }, { changesets, reasons }] = await Promise.all([
    osmChaSuspectRes.json(),
    osmChaStatsRes.json(),
  ])

  if (suspectStatus === 200 && statsStatus == 200) {
    return { changesets, count, reasons }
  }

  if (suspectStatus >= 500) {
    throw new Error('Dataset too big')
  }

  throw new Error(
    `OSMCha API call failed: osmChaSuspectURL: ${suspectStatus}, osmChaStatsURL: ${statsStatus}`
  )
}

const fetchChagesetDataWithRetry = async (osmChaSuspectURL, osmChaStatsURL) => {
  try {
    const { changesets, count, reasons } = await fetchChagesetData(
      osmChaSuspectURL,
      osmChaStatsURL
    )
    return { count, changesets, reasons, complete: true }
  } catch (error) {
    console.log(error.message)

    const dateFilter = lastMonthUnixTime.substring(0, 10)
    const osmChaNewSuspectURL = osmChaSuspectURL + `&date__gte=${dateFilter}`
    const osmChaNewStatsURL = osmChaStatsURL + `&date__gte=${dateFilter}`

    const { changesets, count, reasons } = await fetchChagesetData(
      osmChaNewSuspectURL,
      osmChaNewStatsURL
    )
    return { count, changesets, reasons, complete: false }
  }
}

const commentChangesets = async (responseURL, changesetComment) => {
  const osmChaURL = createOsmChaUrl({ changesetComment })

  try {
    const encodedComment = encodeURIComponent(changesetComment)
    const osmChaSuspectURL = `https://osmcha.org/api/v1/changesets/suspect/?comment=${encodedComment}` // move base URL to Parameter Store
    const osmChaStatsURL = `https://osmcha.org/api/v1/stats/?comment=${encodedComment}` // move base URL to Parameter Store

    const {
      count,
      changesets,
      reasons,
      complete,
    } = await fetchChagesetDataWithRetry(osmChaSuspectURL, osmChaStatsURL)

    const filterDescriptor = complete
      ? `<${osmChaURL}|comment(s): ${changesetComment}>`
      : `<${osmChaURL}|comment(s): ${changesetComment}>\nDue to the large dataset, we are only showing the data from last month.\nAdd more hashtags to filter the results further or click on the hyperlink to see all changesets in OSMCha.`

    const commentBlock = createBlock(
      filterDescriptor,
      changesets,
      reasons,
      count
    )

    await sendToSlack(responseURL, commentBlock)
  } catch (error) {
    console.error(error)

    if (error.message === 'Dataset too big') {
      const timeOutError = {
        response_type: 'ephemeral',
        text:
          ':x: The dataset is too big to show. Please put in additional hashtags to filter the results further. Use the `/osmcha-stats help` command for help on using this command.\n' +
          `<${osmChaURL}|You can see the changesets for ${changesetComment} at OSMCha by clicking here>.`,
      }
      await sendToSlack(responseURL, timeOutError)
      return
    }

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

const projectChangesets = async (responseURL, projectId) => {
  try {
    const taskingManagerURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/?as_file=false&abbreviated=false` // move base URL to Parameter Store
    const tmProjectRes = await fetch(taskingManagerURL)

    if (tmProjectRes.status !== 200) {
      throw new Error('Project cannot be found or accessed')
    }

    const {
      projectInfo,
      aoiBBOX: aoiBBOXArray,
      changesetComment,
      created,
    } = await tmProjectRes.json()

    const aoiBBOX = aoiBBOXArray.join(',')
    const dateCreated = created.substring(0, 10)

    const osmChaSuspectURL = `https://osmcha.org/api/v1/changesets/suspect/?area_lt=2&date__gte=${dateCreated}&comment=${encodeURIComponent(
      changesetComment
    )}&in_bbox=${aoiBBOX}` // move base URL to Parameter Store
    const osmChaStatsURL = `https://osmcha.org/api/v1/stats/?area_lt=2&date__gte=${dateCreated}&comment=${encodeURIComponent(
      changesetComment
    )}&in_bbox=${aoiBBOX}` // move base URL to Parameter Store

    const osmChaURL = createOsmChaUrl({
      aoiBBOX,
      changesetComment,
      dateCreated,
    })

    const filterDescriptor = `<${osmChaURL}|project: #${projectId} - ${projectInfo.name}>`

    const { count, changesets, reasons } = await fetchChagesetData(
      osmChaSuspectURL,
      osmChaStatsURL
    )

    const projectBlock = createBlock(
      filterDescriptor,
      changesets,
      reasons,
      count
    )

    await sendToSlack(responseURL, projectBlock)
    return
  } catch (error) {
    console.error(error)

    if (error.message === 'Project cannot be found or accessed') {
      const projectUnavailable = {
        response_type: 'ephemeral',
        text:
          `:x: ${error.message}` +
          '\nUse the `/osmcha-stats help` command for help on using this command.',
      }
      await sendToSlack(responseURL, projectUnavailable)
      return
    }

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)
  const commandParameters = snsMessage.text

  try {
    if (!commandParameters) {
      const missingParameterBlock = {
        response_type: 'ephemeral',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text:
                ':x: Please input either a project ID or hashtags to filter changesets.\nUse the `/osmcha-stats help` command for additional information.',
            },
          },
        ],
      }
      await sendToSlack(responseURL, missingParameterBlock)
      return
    }

    if (commandParameters === 'help') {
      await sendToSlack(responseURL, HELP_BLOCK)
      return
    }

    const spacedParameters = decodeURIComponent(
      commandParameters.replace(/\+/g, ' ')
    )
    const parameterHasNonDigit = !!spacedParameters.match(/\D/)

    ;(await parameterHasNonDigit)
      ? commentChangesets(responseURL, spacedParameters)
      : projectChangesets(responseURL, commandParameters)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}
