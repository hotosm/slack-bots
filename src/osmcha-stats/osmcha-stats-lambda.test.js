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

test('fetchChangesetData returns { changesets, count, reasons } object after successful API calls', async (t) => {
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
  t.deepEqual(fetchChangesetDataResult, {
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

  t.end()
  fetchStub.restore()
})

test('fetchChangesetData throws error if dataset from OSMCha suspect endpoint is too big', async (t) => {})

test.skip('fetchChangesetData throws error if either API call failed', async (t) => {
  const fetchStub = sinon.stub(fetch, 'Promise')
  fetchStub
    .onCall(0)
    .returns(Promise.resolve({ status: 200, json: () => ({ count: 16 }) }))
  fetchStub.onCall(1).returns(Promise.resolve({ status: 500 }))
  fetchStub.returns(Promise.resolve(null))

  fetchStub.returns(Promise.resolve(null))
  const fetchChangesetDataResult = await lambda.fetchChangesetData(
    'osmChaSuspectURL',
    'osmChaStatsURL',
    'OSMCHA_REQUEST_HEADER'
  )

  sinon.assert.callCount(fetchStub, 2)
  t.equal(
    fetchChangesetDataResult,
    'Error: OSMCha API call failed: osmChaSuspectURL: 200, osmChaStatsURL: 500'
  ) // fix

  t.end()
  fetchStub.restore()
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

test.skip('osmcha-stats return success message if user input valid project ID', async (t) => {
  const sendToSlackStub = sinon
    .stub(utils, 'sendToSlack')
    .returns(Promise.resolve(null))

  const buildOsmchaRequestHeaderStub = sinon
    .stub(lambda, 'buildOsmchaRequestHeader')
    .returns({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'faketokenfortesting',
      },
    })

  const fetchStub = sinon.stub(fetch, 'Promise').returns(
    Promise.resolve({
      status: 200,
      json: () => ({
        projectId: 8989,
        status: 'PUBLISHED',
        projectPriority: 'URGENT',
        aoiBBOX: [-77.952362061, 17.020414352, -77.566993713, 18.2509403230001],
        defaultLocale: 'en',
        projectInfo: {
          locale: 'en',
          name: 'COVID-19 - Saint Elizabeth, Jamaica',
          shortDescription:
            'The 2020 Atlantic Hurricane Season began June 1st. HOT has been requested by disaster preparedness and response actors to map buildings in Caribbean countries and other surrounding countries impacted by the hurricane season and the ongoing COVID-19 Pandemic.  Please join our global effort by mapping on this project.\n\nThe goal of this project is to digitize the buildings using **Maxar** imagery.',
          description:
            'The 2020 Atlantic Hurricane Season began June 1st. Disaster preparedness and response organizations in the Caribbean region are preparing to deal with the compounding impacts of hurricanes and the ongoing COVID-19 Pandemic. This will include needing to know how to balance resource distribution and shelter management with protocols for social distancing. \n\nHOT has been requested by disaster preparedness and response actors to map buildings in Caribbean countries and other surrounding countries impacted by the hurricane season. This data will assist these actors to have a complete buildings layer for their common operational datasets.\n\nGlobally HOT is committed to fighting [COVID-19](https://wiki.openstreetmap.org/wiki/COVID19) by providing 3 critical services:\n1. Helping government agencies and responders with basic data needs: we’re providing this through the  [UN’s Humanitarian Data Exchange](https://data.humdata.org/), among other ways.\n2. Helping to Identify populations living in places most at risk: prioritizing our existing queue of mapping projects to get volunteers immediately mapping areas with high proportions of COVID-19 cases, or of greater vulnerability.\n3. Creating new mapping projects in highest-risk places; which is what this project does. Every feature you map will help in this objective!\n\nThe goal of this project is to digitize the buildings using **Maxar Imagery**. While other services may have sharper imagery, Maxar imagery for this area is the latest imagery available for digitization. \n\nMany areas of the Caribbean have been previously mapped during disaster activations and other projects. We need to continuously work to update and improve the map - especially as new imagery becomes available. Please help us complete and update the base map by looking for missing or new buildings in areas where OSM mapping has already occurred. \n',
          instructions:
            'Project Specific Mapping Notes\n=========================\n* **Imagery:** Please use **Maxar Imagery**. You may switch to Bing, ESRI or others for comparison but Maxar has been chosen for this area due to resolution and clarity. \n* Many of these squares will already be partially or fully mapped, map in more if needed or fix up the existing mapping, or just mark it "Completely Mapped" if it is already complete.\n* **Existing mapping does not match imagery** - This happens in some areas, when different imagery sources are used. If this occurs, check to make sure you are using Bing imagery. If necessary, adjust existing mapping to align with Bing, then continue mapping. \n* **Alternative imagery is better** - Sometimes due to shadows, alignment and other factors it may be easier to trace features using other imagery. That is fine as long as you adjust for any offset. When finished please leave a comment in the Tasking Manager when you mark done/stop mapping to say you used alternative imagery.  See [LearnOSM](https://learnosm.org/en/josm/correcting-imagery-offset/) for detailed instructions on handling imagery offset, or [Aerial Imagery & Alignment](https://learnosm.org/en/hot-tips/imagery/) for adjusting in the iD editor.\n\nBuildings\n=======\n* Two-minute Tutorial: Buildings - https://www.youtube.com/watch?v=E1YJV6I_rhY \n<iframe width="560" height="315" src="https://www.youtube.com/embed/E1YJV6I_rhY" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n* Please accurately outline all the buildings you can find. The outline should be for the full size of the building even if it is partly covered by trees in the imagery.\n* Take care to not include the building shadow in the building outline.\n* After drawing the outline and tagging as a building, **use the \'Q\' key in the iD & JOSM editors to "square" the corners**. We suggest using the Buildings plug-in in JOSM to make building tracing more efficient. \n* Buildings may be very close, but do not actually touch each other, try to map them close to each other without letting them connect or share nodes with each other, roads or residential area outlines. In the iD web editor, holding down the "alt" key will keep nodes from "snapping" to each other and accidentally connecting.\n* In the iD web editor, you will only have the option to tag new features as buildings, see below for editing or adding other features.\n\n**Only if you have personal knowledge of a building**, please add that information to the building, like the name or type of building (hospital, school, gas station, etc)\n',
          perTaskInstructions: '',
        },
        mapperLevel: 'BEGINNER',
        changesetComment: '#hotosm-project-8989   #covid19 #COVJam',
        created: '2020-06-26T13:30:45.790345Z',
        lastUpdated: '2020-08-08T19:09:23.426718Z',
        activeMappers: 0,
        percentMapped: 100,
        percentValidated: 36,
        percentBadImagery: 0,
      }),
    })
  )

  const fetchChangesetData = sinon
    .stub(lambda, 'fetchChangesetData')
    .returns(Promise.resolve())

  // test fetchChangesetData separately and stub here
  // test fetchChangesetDataRetry separately and focus on retry
  // ~stub fetchChangesetData during test
  // ~stub this function everywhere else

  t.end()
  sendToSlackStub.restore()
  buildOsmchaRequestHeaderStub.restore()
})

test.skip('osmcha-stats return error message if user input invalid project ID', async (t) => {})

test.skip('osmcha-stats return success message if user input valid comment hashtag(s) and dataset is not too big', async (t) => {})

test.skip('osmcha-stats return error message if user input comment hashtag(s) with zero results', async (t) => {})

test.skip('osmcha-stats return success message if user input valid comment hashtag(s) and complete dataset is too big but retry with one month filter successful', async (t) => {})

test.skip('osmcha-stats return error message if user input comment hashtag(s) and dataset is too big even with one month filter', async (t) => {})

test.skip('osmcha-stats return error message for other exceptions thrown in lambda', async (t) => {})
