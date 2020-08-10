const test = require('tape')
const sinon = require('sinon')
const fetch = require('node-fetch')

const lambda = require('./osmcha-stats-lambda')
const utils = require('./slack-utils')

const buildMockSNSEvent = (parameter) => {
  return {
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
          Message: `{"token":"xxxx","team_id":"xxxx","team_domain":"hotosm","channel_id":"xxxx","channel_name":"xxxx","user_id":"xxxx","user_name":"xxxx","command":"%2Fosmcha-stats","text":"${parameter}","response_url":"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042TUWCB","trigger_id":"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848"}`,
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
}

test.skip('fetchChangesetData returns { changesets, count, reasons } object after successful API calls', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub
    .onCall(0)
    .returns(Promise.resolve({ status: 200, json: () => ({ count: 16 }) }))
  fetchStub.onCall(1).returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        changesets: 16,
        reasons: [
          {
            harmful_changesets: 0,
            changesets: 16,
            checked_changesets: 0,
            name: 'Review requested',
          },
          {
            harmful_changesets: 0,
            changesets: 8,
            checked_changesets: 0,
            name: 'possible import',
          },
          {
            harmful_changesets: 0,
            changesets: 2,
            checked_changesets: 0,
            name: 'mass modification',
          },
        ],
      }),
    })
  )
  fetchStub.returns(Promise.resolve(null))

  const fetchChangesetDataResult = await lambda.fetchChangesetData(
    'osmChaSuspectURL',
    'osmChaStatsURL',
    'OSMCHA_REQUEST_HEADER'
  )

  sinon.assert.callCount(fetchStub, 2)
  t.equal(fetchChangesetDataResult, {
    changesets: 16,
    count: 16,
    reasons: [
      {
        harmful_changesets: 0,
        changesets: 16,
        checked_changesets: 0,
        name: 'Review requested',
      },
      {
        harmful_changesets: 0,
        changesets: 8,
        checked_changesets: 0,
        name: 'possible import',
      },
      {
        harmful_changesets: 0,
        changesets: 2,
        checked_changesets: 0,
        name: 'mass modification',
      },
    ],
  })
})

test.skip('fetchChangesetData throws error if dataset from OSMCha suspect endpoint is too big', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub.onCall(0).returns(Promise.resolve({ status: 500 }))
  fetchStub
    .onCall(1)
    .returns(Promise.resolve({ status: 200, json: () => ({ count }) }))
  fetchStub.returns(Promise.resolve(null))
})

test.skip('fetchChangesetData throws error either API call failed', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub
    .onCall(0)
    .returns(Promise.resolve({ status: 200, json: () => ({ count }) }))
  fetchStub.onCall(1).returns(Promise.resolve({ status: 500 }))
  fetchStub.returns(Promise.resolve(null))
})

test('osmcha-stats sends error message if no parameter is inputted', async (t) => {
  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await lambda.handler(buildMockSNSEvent(''))

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

test('osmcha-stats return help message if user input "help" as parameter', async (t) => {
  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await lambda.handler(buildMockSNSEvent('help'))

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
              'Using the `/osmcha-stats` command, you can get stats on changesets based on either a project ID or hashtags:',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':small_blue_diamond: `/osmcha-stats [projectID]` for stats on changesets of a Tasking Manager project (e.g. `/osmcha-stats 8172`)',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':small_blue_diamond: `/osmcha-stats [hashtags]` for stats on changesets with specific hashtags. Separate multiple hashtags with a space (e.g. `/osmcha-stats #hotosm-project-8386 #HOTPH`)',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':small_red_triangle: Note that when filtering using hashtags, the hashtags must be in the same order as listed in the changesets.',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':small_red_triangle: For best results, input as many hashtags as you can to filter the changesets more precisely. If the changeset data is too big, we would not be able to present them here.',
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
    }),
    true
  )

  t.end()
  sendToSlackStub.restore()
})

test.skip('osmcha-stats return success message if user input valid project ID', async (t) => {})

test.skip('osmcha-stats return error message if user input invalid project ID', async (t) => {})

test.skip('osmcha-stats return success message if user input valid comment hashtag(s) and dataset is not too big', async (t) => {})

test.skip('osmcha-stats return error message if user input comment hashtag(s) with zero results', async (t) => {})

test.skip('osmcha-stats return success message if user input valid comment hashtag(s) and complete dataset is too big but retry with one month filter successful', async (t) => {})

test.skip('osmcha-stats return error message if user input comment hashtag(s) and dataset is too big even with one month filter', async (t) => {})

test.skip('osmcha-stats return error message for other exceptions thrown in lambda', async (t) => {})
