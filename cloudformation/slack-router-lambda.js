const AWS = require('aws-sdk')

const region = process.env.AWS_REGION
const accountId = process.env.AWS_ACCOUNT_ID

function parseBody(event) {
  const eventJSON = JSON.stringify(event.body, null, 2)
  const eventBody = Buffer.from(eventJSON, 'base64').toString('ascii')
  const bodyArray = eventBody.split('&')

  const bodyObject = bodyArray.reduce((accumulator, currentValue) => {
    const [key, value] = currentValue.split('=')

    accumulator[key] = value

    return accumulator
  }, {})

  return bodyObject
}

exports.handler = async (event) => {
  const eventBody = parseBody(event)
  const command = decodeURIComponent(eventBody.command).substring(1)

  const params = {
    Message: JSON.stringify(eventBody),
    Subject: 'SNS from Slack Slash Command',
    TopicArn: `arn:aws:sns:${region}:${accountId}:${command}`,
  }

  try {
    await new AWS.SNS().publish(params).promise()

    return {
      statusCode: 200,
      body: 'Your message is being processed...',
      headers: { 'Content-Type': 'application/json' },
    }
  } catch (error) {
    return {
      statusCode: 200,
      body: 'Something went wrong with your request.',
      headers: { 'Content-Type': 'application/json' },
    }
  }
}
