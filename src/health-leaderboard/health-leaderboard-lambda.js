const fetch = require('node-fetch')

const ERROR_MESSAGE = {
  response_type: 'ephemeral',
  text:
    ':x: Something went wrong with your request. Please try again and if the error persists, post a message at <#C319P09PB>',
}

const OSM_EPOCH = 22457216 // Wed, 12 Sep 2012 06:56:00 UTC in minutes
const OVERPASS_API_URL =
  process.env.OVERPASS_API_BASE_URL + 'augmented_diff_status'
const OSM_STATS_URL = process.env.OSM_STATS_API_BASE_URL + 'status'
const DAY_IN_MINUTES = 60 * 24

function getDateFromOsmTimestamp(osmTimestamp) {
  return new Date((osmTimestamp + OSM_EPOCH) * 60000).toUTCString()
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

const buildSlackMessage = (latestLeaderboardTime, latestOverpassTime) => {
  const leaderboardStatus = getLeaderboardStatus(
    latestOverpassTime,
    latestLeaderboardTime
  )
  return {
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
}

const sendToSlack = async (responseURL, message) => {
  await fetch(responseURL, {
    method: 'post',
    body: JSON.stringify(message),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

exports.handler = async (event) => {
  const snsMessage = JSON.parse(event.Records[0].Sns.Message)
  const responseURL = decodeURIComponent(snsMessage.response_url)

  try {
    const [overpassRes, osmStatsRes] = await Promise.all([
      fetch(OVERPASS_API_URL),
      fetch(OSM_STATS_URL),
    ])

    if (overpassRes.status !== 200 || osmStatsRes.status !== 200) {
      throw new Error('Overpass or OSM Stats API call failed')
    }

    const [latestOverpassTime, osmStats] = await Promise.all([
      overpassRes.json(),
      osmStatsRes.json(),
    ])

    const osmAugmentedDiffs = osmStats.find(
      (item) => item.component === 'augmented diffs'
    )
    const { id: latestLeaderboardTime } = osmAugmentedDiffs

    const slackMessage = buildSlackMessage(
      latestLeaderboardTime,
      latestOverpassTime
    )
    await sendToSlack(responseURL, slackMessage)
  } catch (error) {
    console.error(error)

    await sendToSlack(responseURL, ERROR_MESSAGE)
  }
}
