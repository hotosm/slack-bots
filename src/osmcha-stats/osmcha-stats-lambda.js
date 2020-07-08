const fetch = require('node-fetch')

const OSMCHA_REQUEST_HEADER = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Token b0f566a5e9113e293a8a2a753af74d59106b4517', //change this with parameter store value
  },
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
          text: `There are *${changesetCount} changesets* under ${filterDescriptor}.`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${suspectChangesetCount} or ${suspectChangesetPercentage}% of changesets* have been flagged as suspicious.\nHere is the breakdown of flags:`,
        },
      },
      ...flagSections,
    ],
  }

  return messageBlock
}

const createSlackResponse = async (responseURL, message) => {
  try {
    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(message),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error(error)
  }
}

const changesetStats = async (
  osmChaSuspectURL,
  osmChaStatsURL,
  responseURL
) => {
  try {
    const [osmChaSuspectRes, osmChaProjectStatsRes] = await Promise.all([
      fetch(osmChaSuspectURL, OSMCHA_REQUEST_HEADER),
      fetch(osmChaStatsURL, OSMCHA_REQUEST_HEADER),
    ])

    const [{ count }, { changesets, reasons }] = await Promise.all([
      osmChaSuspectRes.json(),
      osmChaProjectStatsRes.json(),
    ])

    return { count, changesets, reasons }
  } catch (error) {
    console.error(error)

    await createSlackResponse(responseURL, ERROR_MESSAGE)
  }
}

const hashtagChangesets = async (responseURL, hashtags) => {
  console.log('HASHTAG')

  try {
    const encodedHashtags = encodeURIComponent(hashtags)
    const osmChaSuspectURL = `https://osmcha.org/api/v1/changesets/suspect/?comment=${encodedHashtags}`
    const osmChaStatsURL = `https://osmcha.org/api/v1/stats/?comment=${encodedHashtags}`

    const { count, changesets, reasons } = await changesetStats(
      osmChaSuspectURL,
      osmChaStatsURL,
      responseURL
    )

    const filterDescriptor = `comments: ${hashtags}`

    const hashtagBlock = createBlock(
      filterDescriptor,
      changesets,
      reasons,
      count
    )

    await createSlackResponse(responseURL, hashtagBlock)

    return
  } catch (error) {
    console.error(error)

    await createSlackResponse(responseURL, ERROR_MESSAGE)
  }
}

const projectChangesets = async (responseURL, projectId) => {
  console.log('PROJECT')

  try {
    const taskingManagerURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectId}/?as_file=false&abbreviated=false`

    const tmProjectRes = await fetch(taskingManagerURL)

    if (tmProjectRes.status != 200) {
      const { Error } = await tmProjectRes.json()
      const errorMessage = {
        response_type: 'ephemeral',
        text:
          `:x: ${Error}.\n` +
          'Use the `/osmcha-stats help` command for help on using this command.',
      }

      await createSlackResponse(responseURL, errorMessage)
      return
    }

    let {
      projectInfo,
      aoiBBOX,
      changesetComment,
      created: dateCreated,
    } = await tmProjectRes.json()

    aoiBBOX = aoiBBOX.join()
    changesetComment = encodeURIComponent(changesetComment)
    dateCreated = dateCreated.substring(0, 10)

    const osmChaSuspectURL = `https://osmcha.org/api/v1/changesets/suspect/?area_lt=2&date__gte=${dateCreated}&comment=${changesetComment}&in_bbox=${aoiBBOX}`
    const osmChaStatsURL = `https://osmcha.org/api/v1/stats/?area_lt=2&date__gte=${dateCreated}&comment=${changesetComment}&in_bbox=${aoiBBOX}`

    const { count, changesets, reasons } = await changesetStats(
      osmChaSuspectURL,
      osmChaStatsURL,
      responseURL
    )

    const projectTitle = `project: #${projectId} - ${projectInfo.name}`

    const projectBlock = createBlock(projectTitle, changesets, reasons, count)

    await createSlackResponse(responseURL, projectBlock)

    return
  } catch (error) {
    console.error(error)

    await createSlackResponse(responseURL, ERROR_MESSAGE)
  }
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)
  const commandParameters = snsMessage.text
  console.log(`PARAMETERS: ${commandParameters}`)

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
      await createSlackResponse(responseURL, missingParameterBlock)
      return
    }

    if (commandParameters === 'help') {
      await createSlackResponse(responseURL, HELP_BLOCK)
      return
    }

    const spacedParameters = decodeURIComponent(
      commandParameters.replace(/\+/g, ' ')
    )
    const parameterHasHash = !!spacedParameters.match(/#/)

    parameterHasHash
      ? await hashtagChangesets(responseURL, spacedParameters)
      : await projectChangesets(responseURL, commandParameters)
  } catch (error) {
    console.error(error)

    await createSlackResponse(responseURL, ERROR_MESSAGE)
  }
}
