const fetch = require('node-fetch')

const lastMonthUnixTime = new Date(Date.now() - 2592000000).toISOString()

const OSMCHA_REQUEST_HEADER = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Token b0f566a5e9113e293a8a2a753af74d59106b4517', //change this with parameter store value
  },
}

const throwError = (message) => {
  throw new Error(message)
}

const ERROR_MESSAGE = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>', // move to Parameter Store so it can be used for all generic errors?
}

const HELP_BLOCK = {
  response_type: 'ephemeral',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'Using the `/osmcha-stats` command, you can get stats on changesets based on either a project ID or hashtags:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/osmcha-stats [projectID]` for stats on changesets of a Tasking Manager project (e.g. `/osmcha-stats 8172`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/osmcha-stats [hashtags]` for stats on changesets with specific hashtags. Separate multiple hashtags with a space. (e.g. `/osmcha-stats #covid19 #hotosm-project-8272`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_red_triangle: For best results, input in as many hashtags as you can to filter the changesets more precisely. If the changeset data is too big, we would not be able to present them here.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'If you need more help, post a message at <#C319P09PB>',
      },
    },
  ],
}

const groupFlagsIntoSections = (flags, size) => {
  const flagsArray = []

  for (let i = 0; i < flags.length; i++) {
    const lastFlag = flagsArray[flagsArray.length - 1]

    if (!lastFlag || lastFlag.length === size) {
      flagsArray.push([flags[i]])
    } else {
      lastFlag.push(flags[i])
    }
  }

  return flagsArray.map((flag) => {
    return {
      type: 'section',
      fields: flag,
    }
  })
}

const createBlock = (
  filterDescriptor,
  changesetCount,
  changesetFlags,
  suspectChangesetCount
) => {
  if (changesetCount === 0) {
    const noChangesetBlock = {
      response_type: 'ephemeral',
      text:
        `:x: There are *${changesetCount} changesets* under ${filterDescriptor}\n` +
        'Use the `/osmcha-stats help` command for help on using this command.',
    }
    return noChangesetBlock
  }

  const ARRAY_COUNT = 10

  const suspectChangesetPercentage = Math.round(
    (suspectChangesetCount / changesetCount) * 100
  )

  const flagArray = changesetFlags.reduce((accumulator, flag) => {
    if (flag.changesets != 0) {
      accumulator.push({
        type: 'mrkdwn',
        text: `*${flag.name}*: ${flag.changesets}`,
      })
    }
    return accumulator
  }, [])

  const flagSections = groupFlagsIntoSections(flagArray, ARRAY_COUNT)

  const messageBlock = {
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:page_with_curl: There are *${changesetCount} changesets* under ${filterDescriptor}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:warning: *${suspectChangesetCount} or ${suspectChangesetPercentage}% of changesets* have been flagged as suspicious.\n:small_red_triangle: Here is the breakdown of flags: :small_red_triangle_down:`,
        },
      },
      ...flagSections,
    ],
  }

  return messageBlock
}

const createOsmChaUrl = ({ aoiBBOX, changesetComment, dateCreated }) => {
  const BASE_URL = 'https://osmcha.org/' // move to Parameter Store
  const AREA_LT_VALUE = 2

  const filterArray = (filter) => {
    return [
      {
        label: filter,
        value: filter,
      },
    ]
  }

  const filters = {
    ...(aoiBBOX ? { in_bbox: filterArray(aoiBBOX) } : {}),
    ...(aoiBBOX ? { area_lt: filterArray(AREA_LT_VALUE) } : {}),
    ...(dateCreated
      ? { date__gte: filterArray(dateCreated) }
      : { date__gte: filterArray('') }),
    ...(changesetComment ? { comment: filterArray(changesetComment) } : {}),
  }

  return `${BASE_URL}?filters=${encodeURIComponent(JSON.stringify(filters))}`
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

const changesetData = async (osmChaSuspectURL, osmChaStatsURL) => {
  const [osmChaSuspectRes, osmChaStatsRes] = await Promise.all([
    fetch(osmChaSuspectURL, OSMCHA_REQUEST_HEADER),
    fetch(osmChaStatsURL, OSMCHA_REQUEST_HEADER),
  ])

  if (osmChaSuspectRes.status >= 500 || osmChaStatsRes.status >= 500) {
    const dateFilter = lastMonthUnixTime.substring(0, 10)
    const osmChaNewSuspectURL = osmChaSuspectURL + `&date__gte=${dateFilter}`
    const osmChaNewStatsURL = osmChaStatsURL + `&date__gte=${dateFilter}`

    const [
      osmChaSuspectLastMonthRes,
      osmChaStatsLastMonthRes,
    ] = await Promise.all([
      fetch(osmChaNewSuspectURL, OSMCHA_REQUEST_HEADER),
      fetch(osmChaNewStatsURL, OSMCHA_REQUEST_HEADER),
    ])

    if (
      osmChaSuspectLastMonthRes.status != 200 ||
      osmChaStatsLastMonthRes.status != 200
    ) {
      osmChaSuspectLastMonthRes.status >= 500 ||
      osmChaStatsLastMonthRes.status >= 500
        ? throwError('Dataset too big')
        : throwError('OSMCha API call failed')
    }

    const [{ count }, { changesets, reasons }] = await Promise.all([
      osmChaSuspectLastMonthRes.json(),
      osmChaStatsLastMonthRes.json(),
    ])

    return { count, changesets, reasons, complete: false }
  }

  const [{ count }, { changesets, reasons }] = await Promise.all([
    osmChaSuspectRes.json(),
    osmChaStatsRes.json(),
  ])

  return { count, changesets, reasons, complete: true }
}

const commentChangesets = async (responseURL, changesetComment) => {
  const osmChaURL = createOsmChaUrl({ changesetComment })

  try {
    const encodedComment = encodeURIComponent(changesetComment)
    const osmChaSuspectURL = `https://osmcha.org/api/v1/changesets/suspect/?comment=${encodedComment}` // move base URL to Parameter Store
    const osmChaStatsURL = `https://osmcha.org/api/v1/stats/?comment=${encodedComment}` // move base URL to Parameter Store

    const { count, changesets, reasons, complete } = await changesetData(
      osmChaSuspectURL,
      osmChaStatsURL
    )

    const filterDescriptor = complete
      ? `<${osmChaURL}|comment(s): ${changesetComment}>`
      : `<${osmChaURL}|comment(s): ${changesetComment}>.\nDue to the large dataset, we are only showing the data from last month.\nAdd more hashtags to filter the results further or click on the hyperlink to see all changesets in OSMCha.`

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
          `<${osmChaURL}|You can see the changesets for ${changesetComment} at OSMCha by clicking here.>`,
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

    if (tmProjectRes.status != 200) {
      throwError('Project cannot be found or accessed')
    }

    let {
      projectInfo,
      aoiBBOX,
      changesetComment,
      created: dateCreated,
    } = await tmProjectRes.json()

    aoiBBOX = aoiBBOX.join()
    dateCreated = dateCreated.substring(0, 10)

    const osmChaSuspectURL = `https://osmcha.org/api/v1/changesets/suspect/?area_lt=2&date__gte=${dateCreated}&comment=${encodeURIComponent(
      changesetComment
    )}&in_bbox=${aoiBBOX}` // move base URL to Parameter Store
    const osmChaStatsURL = `https://osmcha.org/api/v1/stats/?area_lt=2&date__gte=${dateCreated}&comment=${encodeURIComponent(
      changesetComment
    )}&in_bbox=${aoiBBOX}` // move base URL to Parameter Store

    const { count, changesets, reasons } = await changesetData(
      osmChaSuspectURL,
      osmChaStatsURL
    )

    const osmChaURL = createOsmChaUrl({
      aoiBBOX,
      changesetComment,
      dateCreated,
    })

    const filterDescriptor = `<${osmChaURL}|project: #${projectId} - ${projectInfo.name}>`

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

    parameterHasNonDigit
      ? await commentChangesets(responseURL, spacedParameters)
      : await projectChangesets(responseURL, commandParameters)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}
