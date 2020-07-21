const AWS = require('aws-sdk')
const crypto = require('crypto')

const region = process.env.AWS_REGION
const accountId = process.env.AWS_ACCOUNT_ID

let ssmConnection
function getSSMConnection() {
  if (ssmConnection) return ssmConnection

  ssmConnection = new AWS.SSM()
  return ssmConnection
}

let snsConnection
function getSNSConnection() {
  if (snsConnection) return ssmConnection

  snsConnection = new AWS.SNS()
  return snsConnection
}

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

async function verifyRequest(req) {
  const ssmParams = {
    Name: 'slack-router-signing-secret',
    WithDecryption: true,
  }

  const ssm = getSSMConnection()
  const ssmResult = await ssm.getParameter(ssmParams).promise()
  const slackSecret = ssmResult.Parameter.Value

  const body = req.body
  const signature = req.headers['X-Slack-Signature']
  const timestamp = req.headers['x-Slack-Request-Timestamp']
  const hmac = crypto.createHmac('sha256', slackSecret)
  const [version, hash] = signature.split('=')

  // Check if timestamp is within five minutes
  const fiveMinutesAgo = ~~(Date.now() / 1000) - 60 * 5
  if (timestamp < fiveMinutesAgo) return false

  hmac.update(`${version}:${timestamp}:${body}`)

  // Check if request signature matches expected value
  return crypto.timingSafeEqual(
    Buffer.from(hmac.digest('hex')),
    Buffer.from(hash)
  )
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false

  try {
    const isValidRequest = await verifyRequest()
    if (!isValidRequest) {
      throw new Error('Request verification failed')
    }

    const eventBody = parseBody(event)
    const command = decodeURIComponent(eventBody.command).substring(1)

    const params = {
      Message: JSON.stringify(eventBody),
      Subject: 'SNS from Slack Slash Command',
      TopicArn: `arn:aws:sns:${region}:${accountId}:${command}`,
    }

    const sns = getSNSConnection()
    await sns.publish(params).promise()

    return {
      statusCode: 200,
      body: 'Your message is being processed...',
      headers: { 'Content-Type': 'application/json' },
    }
  } catch (error) {
    console.error(error)

    return {
      statusCode: 200,
      body:
        ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
      headers: { 'Content-Type': 'application/json' },
    }
  }
}
