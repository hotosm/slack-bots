const fetch = require('node-fetch')

//Generic error message to send back to user. It is recommended to create other error messages especially for user errors (e.g. user has input the wrong parameter)
const ERROR_MESSAGE = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
}

// Helper function to send a message back to Slack using the node-fetch library. Pass the responseURL and message as parameters.
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
  // This will parse the message payload sent by Slack
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)

  // This extracts and decodes the response_url which will be used to send any messages to Slack.
  const responseURL = decodeURIComponent(snsMessage.response_url)

  // This extracts any parameters sent by the user. Delete if command does not require any parameters.
  const commandParameters = snsMessage.text

  try {
    // insert your command logic here
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}
