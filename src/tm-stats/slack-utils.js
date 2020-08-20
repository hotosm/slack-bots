const fetch = require('node-fetch')

exports.ERROR_MESSAGE = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
}

exports.USER_ERROR_BLOCK = {
  response_type: 'ephemeral',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':x: Please check that the project ID / username is correct.\nUse the `/tm-stats help` command for additional information.',
      },
    },
  ],
}

exports.HELP_BLOCK = {
  response_type: 'ephemeral',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'The `/tm-stats` command will return different information depending on what you input:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats` for stats on the Tasking Manager home page',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats [projectID]` for stats on a Tasking Manager project (e.g. `/tm-stats 8172`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats [username]` for stats on a user (e.g. `/tm-stats Charlie Brown`)',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':small_blue_diamond: `/tm-stats [projectID username]` for stats on user contribution in a Tasking Manager project (e.g. `/tm-stats 8172 Charlie Brown`)',
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

exports.sendToSlack = (responseURL, message) => {
  return fetch(responseURL, {
    method: 'post',
    body: JSON.stringify(message),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
