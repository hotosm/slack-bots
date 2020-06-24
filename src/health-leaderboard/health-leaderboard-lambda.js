const fetch = require('node-fetch')

const OVERPASS_API_URL = 'https://overpass-api.de/api/augmented_diff_status'
const OSM_STATS_URL = 'http://osm-stats-production-api.azurewebsites.net/status'

const calculateTimestampDifference = (
  overpassTimestamp,
  leaderboardTimestamp
) => {
  const OSM_EPOCH = 22457216 // Wed, 12 Sep 2012 06:56:00 UTC in minutes

  const overpassEpochTime = (overpassTimestamp + OSM_EPOCH) * 60000
  const overpassDate = new Date(overpassEpochTime)

  const leaderboardEpochTime = (leaderboardTimestamp + OSM_EPOCH) * 60000
  const leaderboardDate = new Date(leaderboardEpochTime)

  let daysDifference =
    (overpassEpochTime - leaderboardEpochTime) / (1000 * 60 * 60 * 24)

  const DIFF_THRESHOLD = 0.0208333 // 30 minutes

  if (daysDifference <= DIFF_THRESHOLD) {
    daysDifference = 'up-to-date'
  } else if (daysDifference > DIFF_THRESHOLD && daysDifference < 1) {
    daysDifference = 'less than 1 day behind'
  } else {
    daysDifference = `${Math.floor(daysDifference)} day(s) behind`
  }

  return {
    overpassDate: overpassDate,
    leaderboardDate: leaderboardDate,
    daysDifference: daysDifference,
  }
}

exports.handler = async (event) => {
  // TODO: try changing message to object in sender, then remove parse and access response_url directly
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)

  try {
    const overpassFetchResponse = await fetch(OVERPASS_API_URL)
    const overpassTimestamp = await overpassFetchResponse.json()

    const osmFetchResponse = await fetch(OSM_STATS_URL)
    const osmStatsArray = await osmFetchResponse.json()

    const osmAugmentedDiffs = osmStatsArray.find(
      (object) => object.component === 'augmented diffs'
    )
    const leaderboardTimestamp = osmAugmentedDiffs.id

    const {
      overpassDate,
      leaderboardDate,
      daysDifference,
    } = calculateTimestampDifference(overpassTimestamp, leaderboardTimestamp)

    const slackMessage = {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:calendar: Missing Maps Leaderboard data is _${daysDifference}_.\nFeature count and user stats were last updated on *${leaderboardDate}*.\nChangeset and Edit count is from *${overpassDate}*.`,
          },
        },
      ],
    }

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(slackMessage),
      headers: { 'Content-Type': 'application/json' },
    })

    return {
      statusCode: 200,
    }
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: 'Something went wrong with your request',
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
