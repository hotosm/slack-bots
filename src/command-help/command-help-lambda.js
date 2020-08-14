const fetch = require('node-fetch')

const HELP_BLOCK = {
  response_type: 'ephemeral',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'We created a number of Slack slash commands to make getting information easier for HOT members. Simply write any of the following slash commands in the message field of any Slack channel or direct message:',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':hospital:*`/health-tm`* checks the status of the Tasking Manager and return its current status plus other information such as number of mappers currently online and total number of projects hosted.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':clipboard:*`/health-leaderboard`* checks if the Missing Maps Leaderboard is currently up-to-date.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':hot:*`/tm-stats`* returns information on the Tasking Manager, projects, or users depending on parameters used.\n:small_blue_diamond:Use `/tm-stats help` for more information on the command.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          ':page_with_curl:*`/osmcha-stats`* allows users to filter changesets based on project ID or hashtag(s) and returns stats on the changesets.\n:small_blue_diamond:Use `/osmcha-stats help` for more information on the command.',
      },
    },
  ],
}

const ERROR_BLOCK = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)

  try {
    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(HELP_BLOCK),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(ERROR_BLOCK),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
