exports.ERROR_MESSAGE = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>.', // move to Parameter Store so it can be used for all generic errors?
}

exports.HELP_BLOCK = {
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
          ':small_blue_diamond: `/osmcha-stats [hashtags]` for stats on changesets with specific hashtags. Separate multiple hashtags with a space (e.g. `/osmcha-stats #hotosm-project-8386 #HOTPH`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_red_triangle: Note that when filtering using hashtags, the hashtags must be in the same order as listed in the changesets.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_red_triangle: For best results, input as many hashtags as you can to filter the changesets more precisely. If the changeset data is too big, we would not be able to present them here.',
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

exports.createBlock = (
  filterDescriptor,
  changesetCount,
  changesetFlags,
  suspectChangesetCount
) => {
  if (changesetCount === 0) {
    const noChangesetBlock = {
      response_type: 'ephemeral',
      text:
        `:x: There are *${changesetCount} changesets* under ${filterDescriptor}.\n` +
        'Use the `/osmcha-stats help` command for help on using this command.',
    }
    return noChangesetBlock
  }

  const ARRAY_COUNT = 4

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
          text: `:page_with_curl: There are *${changesetCount} changesets* under ${filterDescriptor}.`,
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

exports.sendToSlack = (responseURL, message) => {
  return fetch(responseURL, {
    method: 'post',
    body: JSON.stringify(message),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
