const test = require('tape')
const sinon = require('sinon')
const AWS = require('@mapbox/mock-aws-sdk-js')
const fetch = require('node-fetch')

const lambda = require('./tm-stats-lambda')
const utils = require('./slack-utils')
const sendTaskingManagerStats = require('./send-tm-stats')

const buildMockSNSEvent = (parameter) => {
  return {
    Records: [
      {
        EventSource: 'aws:sns',
        EventVersion: '1.0',
        EventSubscriptionArn:
          'arn:aws:sns:us-east-1:xxxx:tm-stats:a7298a2b-faae-4621-b5ca-388762807cd8',
        Sns: {
          Type: 'Notification',
          MessageId: '7de225df-xxxx-5336-a4cc-72458e7f0b54',
          TopicArn: 'arn:aws:sns:us-east-1:xxxx:tm-stats',
          Subject: 'SNS from Slack Slash Command',
          Message: `{"token":"xxxx","team_id":"xxxx","team_domain":"hotosm","channel_id":"xxxx","channel_name":"xxxx","user_id":"xxxx","user_name":"xxxx","command":"%2Ftm-stats","text":"${parameter}","response_url":"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042TUWCB","trigger_id":"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848"}`,
          Timestamp: '2020-07-29T01:58:17.158Z',
          SignatureVersion: '1',
          Signature:
            'dHCa+mefzs8ycz+xxxxUc5LGyo+gZqyVAx9ZGKBvPhQ9i8v5RX0ulcdodER1FvwrNWc7lHmoTgftTl/xyLkMPzgzECwkyjxnob5poIWhRgFUJSOI0BOLFoa37YEcT7SFiQpzzLP2N72g+bvY5Eub3JjgLRedny6V+YBrR654/fEoQY9+un4b9G798R1sEkO5uPEBRGX8TcuhQhd9LRe1+qDmaw4pnZqy9xvCKVll3wGIIWkjGcJWj4U0ynP3ri7k9rbabYX/LhcLyyjoRzQDx3uLFi8ba8Rr8xoobybWHM2ejThbnTO0oqTMv4B0CcPgjHJm5aUbvZ+7sf6Ug==',
          SigningCertUrl:
            'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-xxxx.pem',
          UnsubscribeUrl:
            'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:xxxx:tm-stats:xxxx-faae-4621-b5ca-xxxx',
          MessageAttributes: {},
        },
      },
    ],
  }
}

test('checkIfProjectExists returns true if project ID is valid', async (t) => {
  const fetchStub = sinon
    .stub(fetch, 'Promise')
    .returns(Promise.resolve({ status: 200 }))

  const checkIfProjectExistResult = await lambda.checkIfProjectExists(8989)

  sinon.assert.callCount(fetchStub, 1)

  t.equal(checkIfProjectExistResult, true)

  t.end()
  fetchStub.restore()
})

test('checkIfProjectExists returns false if project ID is invalid', async (t) => {
  const fetchStub = sinon
    .stub(fetch, 'Promise')
    .returns(Promise.resolve({ status: 404 }))

  const checkIfProjectExistResult = await lambda.checkIfProjectExists(1)

  sinon.assert.callCount(fetchStub, 1)

  t.equal(checkIfProjectExistResult, false)

  t.end()
  fetchStub.restore()
})

test('checkIfProjectExist throws error if Tasking Manager is down', async (t) => {
  const fetchStub = sinon
    .stub(fetch, 'Promise')
    .returns(Promise.resolve({ status: 500 }))

  try {
    await lambda.checkIfProjectExists(8989)
    t.fail('Should not get here')
  } catch (err) {
    t.ok(err)
    t.equal(err.message, 'Status 500 when calling Tasking Manager')
  }

  sinon.assert.callCount(fetchStub, 1)

  t.end()
  fetchStub.restore()
})

test('sendTmStats returns success block in successful query', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise').returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        mappersOnline: 10,
        tasksMapped: 10000,
        totalMappers: 100,
        totalProjects: 1000,
      }),
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await sendTaskingManagerStats('responseURL', 'tmApiBaseUrl')

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text:
                ':female-construction-worker::male-construction-worker: *Number of Mappers Online*: 10',
            },
            {
              type: 'mrkdwn',
              text: ':round_pushpin: *Number of Mappers*: 100',
            },
            {
              type: 'mrkdwn',
              text:
                ':teamwork-dreamwork::teamwork-dreamwork: *Number of Tasks Mapped*: 10000',
            },
            {
              type: 'mrkdwn',
              text: ':world_map: *Number of Projects Hosted*: 1000',
            },
          ],
        },
      ],
    }),
    true
  )

  t.end()
  fetchStub.restore()
  sendToSlackStub.restore()
})

test.skip('sendTmStats returns error if fetch status is not 200', async (t) => {})

test.skip('sendTmStats returns error if JSON parsing failed', async (t) => {})

test.skip('sendProjectStats returns success block in successful query', async (t) => {})

test.skip('sendProjectStats returns error if fetch status is not 200', async (t) => {})

test.skip('sendProjectStats returns error if JSON parsing failed', async (t) => {})

test.skip('sendUserStats returns success block in successful query', async (t) => {})

test.skip('sendUserStats returns error if fetch status is 400s', async (t) => {})

test.skip('sendUserStats returns error if fetch status is 500', async (t) => {})

test.skip('sendUserStats returns error if JSON parsing failed', async (t) => {})

test.skip('sendProjectUserStats  returns success block in successful query', async (t) => {})

test.skip('sendProjectUserStats return error if user cannot be found', async (t) => {})

test.skip('sendProjectUserStats returns error if fetch status is not 200', async (t) => {})

test.skip('sendProjectUserStats returns error if JSON parsing failed', async (t) => {})

test.skip('tm-stats send help message if `help` is inputted as parameter', async (t) => {})

test.skip('tm-stats calls sendTmStats if no parameters were passed', async (t) => {})

test.skip('tm-stats calls sendProjectStats if parameter is all digit and project exists', async (t) => {})

test.skip('tm-stats calls sendProjectUserStats if first parameter is all digit and project exists', async (t) => {})

test.skip('tm-stats calls sendUserStats if first parameter contain non-digit character', async (t) => {})

test.skip('tm-stats calls sendUserStats if first parameter is all digit but not a project', async (t) => {})

test.skip('tm-stats calls sendUserStats if parameter contains non-digit character', async (t) => {})

test.skip('tm-stats calls sendUserStats if parameter is all digit but not a project', async (t) => {})

test.skip('tm-stats return generic error message for other exceptions thrown in lambda', async (t) => {})
