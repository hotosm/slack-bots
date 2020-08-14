const AWS = require('aws-sdk')
const fetch = require('node-fetch')

const utils = require('./slack-utils')

const lastMonthUnixTime = new Date(Date.now() - 2592000000).toISOString()
const OSMCHA_API_BASE_URL = process.env.OSMCHA_API_BASE_URL
const TM_API_BASE_URL = process.env.TM_API_BASE_URL

const buildOsmchaRequestHeader = (token) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
  }
}

const getFilterArray = (filter) => {
  return [
    {
      label: filter,
      value: filter,
    },
  ]
}

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

  return `${process.env.OSMCHA_BASE_URL}?filters=${encodeURIComponent(
    JSON.stringify(filters)
  )}`
}

exports.fetchChangesetData = async (
  osmChaSuspectURL,
  osmChaStatsURL,
  OSMCHA_REQUEST_HEADER
) => {
  const [osmChaSuspectRes, osmChaStatsRes] = await Promise.all([
    fetch(osmChaSuspectURL, OSMCHA_REQUEST_HEADER),
    fetch(osmChaStatsURL, OSMCHA_REQUEST_HEADER),
  ])

  const { status: suspectStatus } = osmChaSuspectRes
  const { status: statsStatus } = osmChaStatsRes

  if (suspectStatus >= 500) {
    throw new Error('Dataset too big')
  }

  if (suspectStatus !== 200 || statsStatus !== 200) {
    throw new Error(
      `OSMCha API call failed: osmChaSuspectURL: ${suspectStatus}, osmChaStatsURL: ${statsStatus}`
    )
  }

  const [{ count }, { changesets, reasons }] = await Promise.all([
    osmChaSuspectRes.json(),
    osmChaStatsRes.json(),
  ])
  return { changesets, count, reasons }
}

exports.fetchChangesetDataWithRetry = async (
  osmChaSuspectURL,
  osmChaStatsURL,
  OSMCHA_REQUEST_HEADER
) => {
  try {
    const { changesets, count, reasons } = await exports.fetchChangesetData(
      osmChaSuspectURL,
      osmChaStatsURL,
      OSMCHA_REQUEST_HEADER
    )
    return { count, changesets, reasons, complete: true }
  } catch (error) {
    console.log(error.message)

    const dateFilter = lastMonthUnixTime.substring(0, 10)
    const osmChaNewSuspectURL = osmChaSuspectURL + `&date__gte=${dateFilter}`
    const osmChaNewStatsURL = osmChaStatsURL + `&date__gte=${dateFilter}`

    const { changesets, count, reasons } = await exports.fetchChangesetData(
      osmChaNewSuspectURL,
      osmChaNewStatsURL,
      OSMCHA_REQUEST_HEADER
    )
    return { count, changesets, reasons, complete: false }
  }
}

const commentChangesets = async (
  responseURL,
  changesetComment,
  OSMCHA_REQUEST_HEADER
) => {
  const osmChaURL = createOsmChaUrl({ changesetComment })

  try {
    const encodedComment = encodeURIComponent(changesetComment)
    const osmChaSuspectURL = `${OSMCHA_API_BASE_URL}changesets/suspect/?comment=${encodedComment}`
    const osmChaStatsURL = `${OSMCHA_API_BASE_URL}stats/?comment=${encodedComment}`

    const {
      count,
      changesets,
      reasons,
      complete,
    } = await exports.fetchChangesetDataWithRetry(
      osmChaSuspectURL,
      osmChaStatsURL,
      OSMCHA_REQUEST_HEADER
    )

    const filterDescriptor = complete
      ? `<${osmChaURL}|comment(s): ${changesetComment}>`
      : `<${osmChaURL}|comment(s): ${changesetComment}>\nDue to the large dataset, we are only showing the data from last month.\nAdd more hashtags to filter the results further or click on the hyperlink to see all changesets in OSMCha`

    const commentBlock = utils.createBlock(
      filterDescriptor,
      changesets,
      reasons,
      count
    )

    await utils.sendToSlack(responseURL, commentBlock)
  } catch (error) {
    console.error(error)

    if (error.message === 'Dataset too big') {
      const timeOutError = {
        response_type: 'ephemeral',
        text:
          ':x: The dataset is too big to show. Please put in additional hashtags to filter the results further. Use the `/osmcha-stats help` command for help on using this command.\n' +
          `<${osmChaURL}|You can see the changesets for ${changesetComment} at OSMCha by clicking here>.`,
      }
      await utils.sendToSlack(responseURL, timeOutError)
      return
    }

    await utils.sendToSlack(responseURL, utils.ERROR_MESSAGE)
  }
}

const projectChangesets = async (
  responseURL,
  projectId,
  OSMCHA_REQUEST_HEADER
) => {
  try {
    const taskingManagerURL = `${TM_API_BASE_URL}projects/${projectId}/?as_file=false&abbreviated=false`
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

    const osmChaSuspectURL = `${OSMCHA_API_BASE_URL}changesets/suspect/?area_lt=2&date__gte=${dateCreated}&comment=${encodeURIComponent(
      changesetComment
    )}&in_bbox=${aoiBBOX}`
    const osmChaStatsURL = `${OSMCHA_API_BASE_URL}stats/?area_lt=2&date__gte=${dateCreated}&comment=${encodeURIComponent(
      changesetComment
    )}&in_bbox=${aoiBBOX}`

    const osmChaURL = createOsmChaUrl({
      aoiBBOX,
      changesetComment,
      dateCreated,
    })

    const filterDescriptor = `<${osmChaURL}|project: #${projectId} - ${projectInfo.name}>`

    const { count, changesets, reasons } = await exports.fetchChangesetData(
      osmChaSuspectURL,
      osmChaStatsURL,
      OSMCHA_REQUEST_HEADER
    )

    const projectBlock = utils.createBlock(
      filterDescriptor,
      changesets,
      reasons,
      count
    )

    await utils.sendToSlack(responseURL, projectBlock)
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
      await utils.sendToSlack(responseURL, projectUnavailable)
      return
    }

    await utils.sendToSlack(responseURL, utils.ERROR_MESSAGE)
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
      await utils.sendToSlack(responseURL, missingParameterBlock)
      return
    }

    if (commandParameters === 'help') {
      await utils.sendToSlack(responseURL, utils.HELP_BLOCK)
      return
    }

    const spacedParameters = decodeURIComponent(
      commandParameters.replace(/\+/g, ' ')
    )
    const parameterHasNonDigit = !!spacedParameters.match(/\D/)

    const ssmParams = {
      Name: 'osmcha-token',
      WithDecryption: true,
    }
    const ssmResult = await new AWS.SSM().getParameter(ssmParams).promise()
    const osmChaToken = ssmResult.Parameter.Value

    const OSMCHA_REQUEST_HEADER = buildOsmchaRequestHeader(osmChaToken)

    parameterHasNonDigit
      ? await commentChangesets(
          responseURL,
          spacedParameters,
          OSMCHA_REQUEST_HEADER
        )
      : await projectChangesets(
          responseURL,
          commandParameters,
          OSMCHA_REQUEST_HEADER
        )
  } catch (error) {
    console.error(error)

    await utils.sendToSlack(responseURL, utils.ERROR_MESSAGE)
  }
}
