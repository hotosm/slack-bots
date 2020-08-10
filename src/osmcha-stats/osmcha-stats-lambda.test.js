const test = require('tape')
const sinon = require('sinon')
const fetch = require('node-fetch')

const lambda = require('./osmcha-stats-lambda')
const utils = require('./slack-utils')

const mockSNSEventWithNoParameter = {
  Records: [
    {
      Sns: {
        Message:
          '{"token":"xxxx","team_id":"xxxx","team_domain":"hotosm","channel_id":"xxxx","channel_name":"xxxx","user_id":"xxxx","user_name":"xxxx","command":"%2Fosmcha-stats","text":"","response_url":"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042TUWCB","trigger_id":"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848"}',
      },
    },
  ],
}

const mockSNSEventWithHelpParameter = {
  Records: [
    {
      Sns: {
        Message:
          '{"token":"xxxx","team_id":"xxxx","team_domain":"hotosm","channel_id":"xxxx","channel_name":"xxxx","user_id":"xxxx","user_name":"xxxx","command":"%2Fosmcha-stats","text":"help","response_url":"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042TUWCB","trigger_id":"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848"}',
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

test('osmcha-stats return help message if user input "help" as parameter', async (t) => {
  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await lambda.handler(mockSNSEventWithHelpParameter)

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
