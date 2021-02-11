const fetch = require('node-fetch');
const { WebClient } = require('@slack/web-api');

const SLACK_TOKEN = process.env.SLACK_TOKEN;

const client = new WebClient(SLACK_TOKEN);

const ERROR_MESSAGE = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
}

const buildSlackMessage = (file) => {
  return {
    response_type: 'ephemeral',
    blocks: [
      {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `*Hi* :wave: <${file["permalink"]}|Click here to view ${file["name"]}>`
        },   
      },  
    ]
  }
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

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)

  try {
    const { files } = await client.search.files({query: 'Slack channel directory.pdf'})
    const slackMessage = buildSlackMessage(files.matches[0])
    await sendToSlack(responseURL, slackMessage)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}

