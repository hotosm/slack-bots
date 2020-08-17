const test = require('tape')
const sinon = require('sinon')
const AWS = require('@mapbox/mock-aws-sdk-js')
const fetch = require('node-fetch')

const lambda = require('./tm-stats-lambda')
const utils = require('./slack-utils')
const sendTaskingManagerStats = require('./send-tm-stats')
const sendProjectStats = require('./send-project-stats')
const user = require('./user-stats')

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

test('sendTmStats returns error if fetch status is not 200', async (t) => {
  const errorConsoleSpy = sinon.spy(console, 'error')
  const fetchStub = sinon.stub(fetch, 'Promise').returns(
    Promise.resolve({
      status: 500,
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await sendTaskingManagerStats('responseURL', 'tmApiBaseUrl')

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(errorConsoleSpy, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    errorConsoleSpy.args[0][0].message,
    'Cannot get Tasking Manager home page stats'
  )
  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      text:
        ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
    }),
    true
  )

  t.end()
  fetchStub.restore()
  errorConsoleSpy.restore()
  sendToSlackStub.restore()
})

test('sendTmStats returns error if JSON parsing failed', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise').returns(
    Promise.resolve({
      status: 200,
      json: () => {
        throw new Error('Expected JSON parsing error')
      },
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
      text:
        ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
    }),
    true
  )

  t.end()
  fetchStub.restore()
  sendToSlackStub.restore()
})

test('sendProjectStats returns success block in successful query', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise')

  fetchStub.onCall(0).returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        projectInfo: {
          locale: 'en',
          name: 'COVID-19 - Saint Elizabeth, Jamaica',
          shortDescription:
            'The 2020 Atlantic Hurricane Season began June 1st. HOT has been requested by disaster preparedness and response actors to map buildings in Caribbean countries and other surrounding countries impacted by the hurricane season and the ongoing COVID-19 Pandemic.',
          description:
            'The 2020 Atlantic Hurricane Season began June 1st. Disaster preparedness and response organizations in the Caribbean region are preparing to deal with the compounding impacts of hurricanes and the ongoing COVID-19 Pandemic. This will include needing to know how to balance resource distribution and shelter management with protocols for social distancing. \n\nHOT has been requested by disaster preparedness and response actors to map buildings in Caribbean countries and other surrounding countries impacted by the hurricane season. This data will assist these actors to have a complete buildings layer for their common operational datasets.\n\nGlobally HOT is committed to fighting [COVID-19](https://wiki.openstreetmap.org/wiki/COVID19) by providing 3 critical services:\n1. Helping government agencies and responders with basic data needs: we’re providing this through the  [UN’s Humanitarian Data Exchange](https://data.humdata.org/), among other ways.\n2. Helping to Identify populations living in places most at risk: prioritizing our existing queue of mapping projects to get volunteers immediately mapping areas with high proportions of COVID-19 cases, or of greater vulnerability.\n3. Creating new mapping projects in highest-risk places; which is what this project does. Every feature you map will help in this objective!\n\nThe goal of this project is to digitize the buildings using **Maxar Imagery**. While other services may have sharper imagery, Maxar imagery for this area is the latest imagery available for digitization. \n\nMany areas of the Caribbean have been previously mapped during disaster activations and other projects. We need to continuously work to update and improve the map - especially as new imagery becomes available. Please help us complete and update the base map by looking for missing or new buildings in areas where OSM mapping has already occurred. \n',
        },
        percentMapped: 100,
        percentValidated: 44,
        status: 'PUBLISHED',
      }),
    })
  )
  fetchStub.onCall(1).returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        'projectArea(in sq.km)': 1200.456,
        totalMappers: 150,
        totalTasks: 1247,
      }),
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await sendProjectStats('responseURL', 'tmApiBaseUrl', 'tmBaseUrl/', 8989)

  sinon.assert.callCount(fetchStub, 2)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              '<tmBaseUrl/project/8989|*8989 - COVID-19 - Saint Elizabeth, Jamaica*>',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              '*PUBLISHED* - The 2020 Atlantic Hurricane Season began June 1st. HOT has been requested by disaster preparedness and response actors to map buildings in Caribbean countries and other surrounding countries impacted by the hurricane season and the ongoing COVID-19 Pandemic.',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: ':world_map: *Project Area* - 1200.456} sq. km.',
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text:
                ':female-construction-worker::male-construction-worker: *Number of Contributors*: 150',
            },
            { type: 'mrkdwn', text: ':clipboard: *Number of Tasks*: 1247' },
            { type: 'mrkdwn', text: ':round_pushpin: *100%* Mapped' },
            { type: 'mrkdwn', text: ':white_check_mark: *44%* Validated' },
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

test('sendProjectStats returns error if fetch status is not 200', async (t) => {
  const errorConsoleSpy = sinon.spy(console, 'error')
  const fetchStub = sinon.stub(fetch, 'Promise')

  fetchStub.onCall(0).returns(Promise.resolve({ status: 500 }))
  fetchStub.onCall(1).returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        'projectArea(in sq.km)': 1200.456,
        totalMappers: 150,
        totalTasks: 1247,
      }),
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await sendProjectStats('responseURL', 'tmApiBaseUrl', 'tmBaseUrl/', 8989)

  sinon.assert.callCount(fetchStub, 2)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    errorConsoleSpy.args[0][0].message,
    'Cannot get project information from Tasking Manager'
  )
  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      text:
        ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
    }),
    true
  )

  t.end()
  errorConsoleSpy.restore()
  fetchStub.restore()
  sendToSlackStub.restore()
})

test('sendProjectStats returns error if JSON parsing failed', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise')

  fetchStub.onCall(0).returns(Promise.resolve({ status: 200 }))
  fetchStub.onCall(1).returns(
    Promise.resolve({
      status: 200,
      json: () => {
        throw new Error('Expected JSON parsing error')
      },
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await sendProjectStats('responseURL', 'tmApiBaseUrl', 'tmBaseUrl/', 8989)

  sinon.assert.callCount(fetchStub, 2)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      text:
        ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
    }),
    true
  )

  t.end()
  fetchStub.restore()
  sendToSlackStub.restore()
})

test('sendUserStats returns success block in successful query', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise').returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        totalTimeSpent: 9574003,
        timeSpentMapping: 1023470,
        timeSpentValidating: 8550533,
        projectsMapped: 192,
        tasksMapped: 393,
        tasksValidated: 29948,
        tasksInvalidated: 1669,
        tasksInvalidatedByOthers: 1372,
        tasksValidatedByOthers: 2784,
      }),
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await user.sendUserStats(
    'responseURL',
    'tmToken',
    'tmApiBaseUrl',
    'tmBaseUrl',
    'userName'
  )

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':star2: *User <tmBaseUrlusers/userName|userName> has mapped 192 project(s)* :star2:',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              'They have spent *110 days 19 hours 26 minutes 43 seconds* in total contributing to the community',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text:
                ':mantelpiece_clock: *11 days 20 hours 17 minutes 50 seconds* mapping',
            },
            {
              type: 'mrkdwn',
              text:
                ':mantelpiece_clock: *98 days 23 hours 8 minutes 53 seconds* validating',
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':round_pushpin: They have mapped *393 tasks* :round_pushpin:',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: ':white_check_mark: Validated *29948 tasks*',
            },
            {
              type: 'mrkdwn',
              text: ':negative_squared_cross_mark: Invalidated *1669 tasks*',
            },
            {
              type: 'mrkdwn',
              text: ':heavy_check_mark: Had *2784 tasks* validated by others',
            },
            {
              type: 'mrkdwn',
              text:
                ':heavy_multiplication_x: Had *1372 tasks* invalidated by others',
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

test('sendUserStats returns error if fetch status is 400s', async (t) => {
  const errorConsoleSpy = sinon.spy(console, 'error')
  const fetchStub = sinon
    .stub(fetch, 'Promise')
    .returns(Promise.resolve({ status: 400 }))

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await user.sendUserStats(
    'responseURL',
    'tmToken',
    'tmApiBaseUrl',
    'tmBaseUrl',
    'userName'
  )

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(errorConsoleSpy, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    errorConsoleSpy.args[0][0].message,
    'User cannot be found or accessed'
  )
  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':x: Please check that the project ID / username is correct.\nUse the `/tm-stats help` command for additional information.',
          },
        },
      ],
    }),
    true
  )

  t.end()
  errorConsoleSpy.restore()
  fetchStub.restore()
  sendToSlackStub.restore()
})

test('sendUserStats returns error if fetch status is 500', async (t) => {
  const errorConsoleSpy = sinon.spy(console, 'error')
  const fetchStub = sinon
    .stub(fetch, 'Promise')
    .returns(Promise.resolve({ status: 500 }))

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await user.sendUserStats(
    'responseURL',
    'tmToken',
    'tmApiBaseUrl',
    'tmBaseUrl',
    'userName'
  )

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(errorConsoleSpy, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    errorConsoleSpy.args[0][0].message,
    'Cannot get user stats from Tasking Manager'
  )
  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      text:
        ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
    }),
    true
  )

  t.end()
  errorConsoleSpy.restore()
  fetchStub.restore()
  sendToSlackStub.restore()
})

test('sendUserStats returns error if JSON parsing failed', async (t) => {
  const fetchStub = sinon
    .stub(fetch, 'Promise')
    .returns(Promise.resolve({ status: 500 }))

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await user.sendUserStats(
    'responseURL',
    'tmToken',
    'tmApiBaseUrl',
    'tmBaseUrl',
    'userName'
  )

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      text:
        ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
    }),
    true
  )

  t.end()
  fetchStub.restore()
  sendToSlackStub.restore()
})

test('sendProjectUserStats returns success block in successful query', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise').returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        timeSpentMapping: 816,
        timeSpentValidating: 190591,
        totalTimeSpent: 191407,
      }),
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await user.sendProjectUserStats(
    'responseURL',
    'tmToken',
    'tmApiBaseUrl',
    'tmBaseUrl',
    8989,
    'userName'
  )

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              'User *userName* has spent *2 days 5 hours 10 minutes 7 seconds* contributing to <tmBaseUrlproject/8989|project 8989>:',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: ':round_pushpin: 13 minutes 36 seconds mapping',
            },
            {
              type: 'mrkdwn',
              text:
                ':white_check_mark: 2 days 4 hours 56 minutes 31 seconds validating',
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

test('sendProjectUserStats return error if user cannot be found', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise').returns(
    Promise.resolve({
      status: 404,
      json: () => {
        throw new Error('User not found')
      },
    })
  )

  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  await user.sendProjectUserStats(
    'responseURL',
    'tmToken',
    'tmApiBaseUrl',
    'tmBaseUrl',
    8989,
    'userName'
  )

  sinon.assert.callCount(fetchStub, 1)
  sinon.assert.callCount(sendToSlackStub, 1)

  t.equal(
    utils.sendToSlack.calledWith('responseURL', {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              ':x: Please check that the project ID / username is correct.\nUse the `/tm-stats help` command for additional information.',
          },
        },
      ],
    }),
    true
  )

  t.end()
  fetchStub.restore()
  sendToSlackStub.restore()
})

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
