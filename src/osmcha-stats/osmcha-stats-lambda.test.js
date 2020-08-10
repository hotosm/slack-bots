const test = require('tape')
const sinon = require('sinon')
const fetch = require('node-fetch')

const lambda = require('./osmcha-stats-lambda')
const utils = require('./slack-utils')

const mockSNSEventWithNoParameter = {
  Records: [
    {
      EventSource: 'aws:sns',
      EventVersion: '1.0',
      EventSubscriptionArn:
        'arn:aws:sns:us-east-1:xxxx:osmcha-stats:a7298a2b-faae-4621-b5ca-388762807cd8',
      Sns: {
        Type: 'Notification',
        MessageId: '7de225df-xxxx-5336-a4cc-72458e7f0b54',
        TopicArn: 'arn:aws:sns:us-east-1:xxxx:osmcha-stats',
        Subject: 'SNS from Slack Slash Command',
        Message:
          '{"token":"xxxx","team_id":"xxxx","team_domain":"hotosm","channel_id":"xxxx","channel_name":"xxxx","user_id":"xxxx","user_name":"xxxx","command":"%2Fosmcha-stats","text":"","response_url":"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042TUWCB","trigger_id":"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848"}',
        Timestamp: '2020-07-29T01:58:17.158Z',
        SignatureVersion: '1',
        Signature:
          'dHCa+mefzs8ycz+xxxxUc5LGyo+gZqyVAx9ZGKBvPhQ9i8v5RX0ulcdodER1FvwrNWc7lHmoTgftTl/xyLkMPzgzECwkyjxnob5poIWhRgFUJSOI0BOLFoa37YEcT7SFiQpzzLP2N72g+bvY5Eub3JjgLRedny6V+YBrR654/fEoQY9+un4b9G798R1sEkO5uPEBRGX8TcuhQhd9LRe1+qDmaw4pnZqy9xvCKVll3wGIIWkjGcJWj4U0ynP3ri7k9rbabYX/LhcLyyjoRzQDx3uLFi8ba8Rr8xoobybWHM2ejThbnTO0oqTMv4B0CcPgjHJm5aUbvZ+7sf6Ug==',
        SigningCertUrl:
          'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-xxxx.pem',
        UnsubscribeUrl:
          'https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:xxxx:osmcha-stats:xxxx-faae-4621-b5ca-xxxx',
        MessageAttributes: {},
      },
    },
  ],
}

// test.skip('createOsmChaUrl creates a URL - given all parameters', (t) => {
//   const aoiBBOX = '-77.952362061,17.020414352,-77.566993713,18.2509403230001'
//   const changesetComment = '#hotosm-project-8989 #covid19 #COVJam'
//   const dateCreated = '2020-06-26'
//   const expected =
//     'https://osmcha.org/filters?filters=%7B%22in_bbox%22%3A%5B%7B%22label%22%3A%22-77.952362061%2C17.020414352%2C-77.566993713%2C18.2509403230001%22%2C%22value%22%3A%22-77.952362061%2C17.020414352%2C-77.566993713%2C18.2509403230001%22%7D%5D%2C%22area_lt%22%3A%5B%7B%22label%22%3A2%2C%22value%22%3A2%7D%5D%2C%22date__gte%22%3A%5B%7B%22label%22%3A%222020-06-26%22%2C%22value%22%3A%222020-06-26%22%7D%5D%2C%22comment%22%3A%5B%7B%22label%22%3A%22%23hotosm-project-8989%20%20%20%23covid19%20%23COVJam%22%2C%22value%22%3A%22%23hotosm-project-8989%20%20%20%23covid19%20%23COVJam%22%7D%5D%7D'

//   const osmchaURL = lambda.createOsmChaUrl(
//     aoiBBOX,
//     changesetComment,
//     dateCreated
//   )
//   console.log(osmchaURL)

//   t.equal(osmchaURL, expected)
//   t.end
// })

// test.skip('createOsmChaUrl creates a URL - no date created', (t) => {})

test('osmcha-stats sends error message if no parameter is inputted', async (t) => {
  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await lambda.handler(mockSNSEventWithNoParameter)

  sinon.assert.callCount(sendToSlackStub, 1)
  t.equal(
    utils.sendToSlack.calledWith('https://hooks.slack.com/commands/T042TUWCB', {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':x: Please input either a project ID or hashtags to filter changesets.\nUse the `/osmcha-stats help` command for additional information.',
          },
        },
      ],
    }),
    true
  )

  t.end()
  sendToSlackStub.restore()
})

test.skip('osmcha-stats return help message if user input "help" as parameter', (t) => {})

test.skip('osmcha-stats return success message if user input valid project ID', (t) => {})

test.skip('osmcha-stats return error message if user input invalid project ID', (t) => {})

test.skip('osmcha-stats return success message if user input valid comment hashtag(s) and dataset is not too big', (t) => {})

test.skip('osmcha-stats return error message if user input comment hashtag(s) with zero results', (t) => {})

test.skip('osmcha-stats return success message if user input valid comment hashtag(s) and complete dataset is too big but retry with one month filter successful', (t) => {})

test.skip('osmcha-stats return error message if user input comment hashtag(s) and dataset is too big even with one month filter', (t) => {})

test.skip('osmcha-stats return error message for other exceptions thrown in lambda', (t) => {})
