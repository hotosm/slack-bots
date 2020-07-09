const fetch = require('node-fetch')

const ERROR_MESSAGE =
  ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>'
const OSM_EPOCH = 22457216 // Wed, 12 Sep 2012 06:56:00 UTC in minutes
const OVERPASS_API_URL = 'https://overpass-api.de/api/augmented_diff_status'
const OSM_STATS_URL = 'http://osm-stats-production-api.azurewebsites.net/status'
const DAY_IN_MINUTES = 60 * 24

function getDateFromOsmTimestamp(osmTimestamp) {
  return new Date((osmTimestamp + OSM_EPOCH) * 60000)
}

const getLeaderboardStatus = (overpassTime, leaderboardTime) => {
  const difference = overpassTime - leaderboardTime

  if (difference <= 30) {
    return 'up-to-date'
  }

  if (difference < DAY_IN_MINUTES) {
    return 'less than 1 day behind'
  }

  return `${Math.trunc(difference / DAY_IN_MINUTES)} day(s) behind`
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)

  try {
    const [overpassRes, osmStatsRes] = await Promise.all([
      fetch(OVERPASS_API_URL),
      fetch(OSM_STATS_URL),
    ])

    if (overpassRes.status != 200 || osmStatsRes.status != 200) {
      await fetch(responseURL, {
        method: 'post',
        body: {
          response_type: 'ephemeral',
          text: ERROR_MESSAGE,
        },
        headers: { 'Content-Type': 'application/json' },
      })

      return
    }

    const [latestOverpassTime, osmStats] = await Promise.all([
      overpassRes.json(),
      osmStatsRes.json(),
    ])

    const osmAugmentedDiffs = osmStats.find(
      (object) => object.component === 'augmented diffs'
    )
    const latestLeaderboardTime = osmAugmentedDiffs.id

    const leaderboardStatus = getLeaderboardStatus(
      latestOverpassTime,
      latestLeaderboardTime
    )

    const slackMessage = {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:calendar: Missing Maps Leaderboard data is _${leaderboardStatus}_.`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:small_orange_diamond: Feature count and user stats were last updated on *${getDateFromOsmTimestamp(
              latestLeaderboardTime
            )}*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:small_orange_diamond: Changeset and edit count is from *${getDateFromOsmTimestamp(
              latestOverpassTime
            )}*.`,
          },
        },
      ],
    }

    await fetch(responseURL, {
      method: 'post',
      body: JSON.stringify(slackMessage),
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)

    await fetch(responseURL, {
      method: 'post',
      body: {
        response_type: 'ephemeral',
        text: ERROR_MESSAGE,
      },
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
