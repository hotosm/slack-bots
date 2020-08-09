const test = require('tape')
const sinon = require('sinon')
const fetch = require('node-fetch')

const lambda = require('./health-leaderboard-lambda')

const mockSNSEvent = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn:
        'arn:aws:sns:us-east-1:xxxx:health-tm:a7298a2b-faae-4621-b5ca-388762807cd8',
      Sns: {
        Type: 'Notification',
        MessageId: '7de225df-xxxx-5336-a4cc-72458e7f0b54',
        TopicArn: 'arn:aws:sns:us-east-1:xxxx:health-tm',
        Subject: 'SNS from Slack Slash Command',
        Message:
          '{"token":"xxxx","team_id":"xxxx","team_domain":"hotosm","channel_id":"xxxx","channel_name":"xxxx","user_id":"xxxx","user_name":"xxxx","command":"%2Fhealth-leaderboard","text":"i+am+a+text","response_url":"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042TUWCB","trigger_id":"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848"}',
        Timestamp: '2020-07-29T01:58:17.158Z',
        SignatureVersion: '1',
        Signature:
          'dHCa+mefzs8ycz+xxxxUc5LGyo+gZqyVAx9ZGKBvPhQ9i8v5RX0ulcdodER1FvwrNWc7lHmoTgftTl/xyLkMPzgzECwkyjxnob5poIWhRgFUJSOI0BOLFoa37YEcT7SFiQpzzLP2N72g+bvY5Eub3JjgLRedny6V+YBrR654/fEoQY9+un4b9G798R1sEkO5uPEBRGX8TcuhQhd9LRe1+qDmaw4pnZqy9xvCKVll3wGIIWkjGcJWj4U0ynP3ri7k9rbabYX/LhcLyyjoRzQDx3uLFi8ba8Rr8xoobybWHM2ejThbnTO0oqTMv4B0CcPgjHJm5aUbvZ+7sf6Ug==',
        SigningCertUrl:
          'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-xxxx.pem',
        UnsubscribeUrl:
          'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:xxxx:health-tm:xxxx-faae-4621-b5ca-xxxx',
        MessageAttributes: {},
      },
    },
  ],
}

test('getLeaderboardStatus to returns "up-to-date"', (t) => {
  const overpassTime = 4158914
  const leaderboardTime = 4158930
  const expected = 'up-to-date'

  const timestampDifference = lambda.getLeaderboardStatus(
    overpassTime,
    leaderboardTime
  )

  t.equal(timestampDifference, expected, true)

  t.end()
})

test('getLeaderboardStatus to returns "less than 1 day behind"', (t) => {
  const overpassTime = 4158964
  const leaderboardTime = 4158844 // 120 minutes behind
  const expected = 'less than 1 day behind'

  const timestampDifference = lambda.getLeaderboardStatus(
    overpassTime,
    leaderboardTime
  )

  t.equal(timestampDifference, expected)

  t.end()
})

test('getLeaderboardStatus to returns "7 day(s) behind"', (t) => {
  const overpassTime = 4158964
  const leaderboardTime = 4148834 // 7 days behind
  const expected = '7 day(s) behind'

  const timestampDifference = lambda.getLeaderboardStatus(
    overpassTime,
    leaderboardTime
  )

  t.equal(timestampDifference, expected)

  t.end()
})

test.skip('health-leaderboard sends success block after successful API call', async (t) => {
  const sendToSlackStub = sinon
    .stub(lambda, 'sendToSlack')
    .returns(Promise.resolve(null))

  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub.onCall(0).returns(
    Promise.resolve({
      status: 200,
      json: () => 4158976,
    })
  )
  fetchStub.onCall(1).returns(
    Promise.resolve({
      status: 200,
      json: () => [
        {
          component: 'augmented diffs',
          id: 4154779,
          updated_at: '2020-08-09T09:17:39.504Z',
        },
        {
          component: 'changesets',
          id: 4054404,
          updated_at: '2020-08-09T11:13:26.917Z',
        },
      ],
    })
  )
  fetchStub.returns(Promise.resolve(null))

  await lambda.handler(mockSNSEvent)
  console.log(lambda.sendToSlack())

  sinon.assert.callCount(fetchStub, 2)
  sinon.assert.callCount(sendToSlackStub, 1)
  t.equal(
    lambda.sendToSlack.calledWith(
      'https://hooks.slack.com/commands/T042TUWCB',
      {
        response_type: 'ephemeral',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:calendar: Missing Maps Leaderboard data is _2 day(s) behind_.`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:small_orange_diamond: Feature count and user stats were last updated on *Thu Aug 06 2020 13:15:00 GMT+0000 (Coordinated Universal Time)*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:small_orange_diamond: Changeset and edit count is from *Sun Aug 09 2020 11:13:00 GMT+0000 (Coordinated Universal Time)*.`,
            },
          },
        ],
      }
    ),
    true
  )

  t.end()
  sendToSlackStub.restore()
  fetchStub.restore()
})

test('health-leaderboard sends error message after failed API call', async (t) => {
  const sendToSlackStub = sinon
    .stub(lambda, 'sendToSlack')
    .returns(Promise.resolve(null))

  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub.onCall(0).returns(Promise.resolve({ status: 200 }))
  fetchStub.onCall(1).returns(Promise.resolve({ status: 200 }))
  fetchStub.returns(Promise.resolve(null))

  await lambda.handler(mockSNSEvent)

  sinon.assert.callCount(fetchStub, 2)
  sinon.assert.callCount(sendToSlackStub, 1)
  t.equal(
    lambda.sendToSlack.calledWith(
      'https://hooks.slack.com/commands/T042TUWCB',
      {
        response_type: 'ephemeral',
        text:
          ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
      }
    ),
    true
  )

  t.end()
  sendToSlackStub.restore()
  fetchStub.restore()
})

test('health-leaderboard sends error message after failed JSON parsing', async (t) => {
  const sendToSlackStub = sinon
    .stub(lambda, 'sendToSlack')
    .returns(Promise.resolve(null))

  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub.onCall(0).returns(Promise.resolve({ status: 200 }))
  fetchStub.onCall(1).returns(
    Promise.resolve({
      status: 200,
      json: () => {
        throw new Error()
      },
    })
  )
  fetchStub.returns(Promise.resolve(null))

  await lambda.handler(mockSNSEvent)

  sinon.assert.callCount(fetchStub, 2)
  sinon.assert.callCount(sendToSlackStub, 1)
  t.equal(
    lambda.sendToSlack.calledWith(
      'https://hooks.slack.com/commands/T042TUWCB',
      {
        response_type: 'ephemeral',
        text:
          ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
      }
    ),
    true
  )

  t.end()
  sendToSlackStub.restore()
  fetchStub.restore()
})
