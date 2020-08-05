const test = require('tape')
const sinon = require('sinon')
const fetch = require('node-fetch')

const slackUtils = require('./slack-utils')
const lambda = require('./health-tm-lambda')

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
          '{"token":"xxxx","team_id":"xxxx","team_domain":"hotosm","channel_id":"xxxx","channel_name":"xxxx","user_id":"xxxx","user_name":"xxxx","command":"%2Fhealth-tm","text":"i+am+a+text","response_url":"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042TUWCB","trigger_id":"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848"}',
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

test('health-tm sends success block after successful API call', async (t) => {
  // spy sendToSlack
  const sendToSlackStub = sinon
    .stub(slackUtils, 'sendToSlack')
    .returns(Promise.resolve(null))

  // mock fetch return value
  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub.onCall(0).returns(Promise.resolve({ status: 200 }))
  fetchStub.onCall(1).returns(
    Promise.resolve({
      status: 200,
      json: () => ({ mappersOnline: 7, totalProjects: 4000 }),
    })
  )
  fetchStub.returns(Promise.resolve(null))

  await lambda.handler(mockSNSEvent)

  // expect
  sinon.assert.callCount(fetchStub, 2)
  sinon.assert.callCount(sendToSlackStub, 1)
  t.equal(
    lambda.slackUtils.calledWith([
      'https://hooks.slack.com/commands/T042TUWCB',
      {
        response_type: 'ephemeral',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: ':white_check_mark: *The Tasking Manager is operational*',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `:female-construction-worker::male-construction-worker:*Number of Mappers Online*: 7`,
              },
              {
                type: 'mrkdwn',
                text: `:world_map: *Number of Projects Hosted*: 4000`,
              },
            ],
          },
        ],
      },
    ]),
    true
  )

  t.end()
  sendToSlackStub.restore()
})
