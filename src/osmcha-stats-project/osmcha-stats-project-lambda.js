const fetch = require('node-fetch')

const OSMCHA_REQUEST_HEADER = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Token b0f566a5e9113e293a8a2a753af74d59106b4517', //change this with parameter store value
  },
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
  projectId,
  projectInfo,
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
        text: `*${flag.name}*: ${flag.changesets} changesets`,
      })
    }
    return accumulator
  }, [])

  const flagSections = groupFlagsIntoSections(flagArray, ARRAY_COUNT)

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `There are *${changesetCount} changesets* for #${projectId} - ${projectInfo.name}.`,
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
  ]
}

const parseEvent = (event) => {
  const snsJSON = JSON.stringify(event.Records[0].Sns)
  const snsObject = JSON.parse(snsJSON)
  const decodedSns = JSON.parse(decodeURIComponent(snsObject.Message))

  return decodedSns
}

exports.handler = async (event) => {
  const body = parseEvent(event)
  const responseURL = body.response_url
  const projectID = body.text

  try {
    const taskingManagerURL = `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${projectID}/?as_file=false&abbreviated=false`

    const taskingManagerProjectJSON = await fetch(taskingManagerURL)
    const taskingManagerProjectObj = await taskingManagerProjectJSON.json()
    let {
      projectInfo,
      aoiBBOX,
      changesetComment,
      created: dateCreated,
    } = taskingManagerProjectObj

    aoiBBOX = aoiBBOX.join()
    changesetComment = encodeURIComponent(changesetComment)
    dateCreated = dateCreated.substring(0, 10)

    const osmChaSuspectURL = `https://osmcha.org/api/v1/changesets/suspect/?area_lt=2&date__gte=${dateCreated}&comment=${changesetComment}&in_bbox=${aoiBBOX}`

    const osmChaSuspectJSON = await fetch(
      osmChaSuspectURL,
      OSMCHA_REQUEST_HEADER
    )
    const osmChaSuspectObj = await osmChaSuspectJSON.json()
    const { count: suspectChangesetCount } = osmChaSuspectObj

    const osmChaStatsURL = `https://osmcha.org/api/v1/stats/?area_lt=2&date__gte=${dateCreated}&comment=${changesetComment}&in_bbox=${aoiBBOX}`

    const osmChaProjectStatsJSON = await fetch(
      osmChaStatsURL,
      OSMCHA_REQUEST_HEADER
    )
    const osmChaProjectStatsObj = await osmChaProjectStatsJSON.json()
    const { changesets, reasons } = osmChaProjectStatsObj

    const slackMessage = {
      response_type: 'ephemeral',
      blocks: createBlock(
        projectID,
        projectInfo,
        changesets,
        reasons,
        suspectChangesetCount
      ),
    }

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(slackMessage),
      headers: { 'Content-Type': 'application/json' },
    })

    return {
      statusCode: 200,
    }
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify('Something went wrong with your request'),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
