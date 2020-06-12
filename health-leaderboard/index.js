const fetch = require('node-fetch')

const OVERPASS_API_URL = 'https://overpass-api.de/api/augmented_diff_status'

const OSM_STATS_URL = 'http://osm-stats-production-api.azurewebsites.net/status'

const parseEvent = (event) => {
  const snsJSON = JSON.stringify(event.Records[0].Sns)
  const snsObject = JSON.parse(snsJSON)
  const decodedSns = JSON.parse(decodeURIComponent(snsObject.Message))

  return decodedSns
}

const calculateTimestampDifference = (
  overpassTimestamp,
  leaderboardTimestamp
) => {
  const overpassEpochTime = (overpassTimestamp + 22457216) * 60000
  const overpassDate = new Date(overpassEpochTime)

  const leaderboardEpochTime = (leaderboardTimestamp + 22457216) * 60000
  const leaderboardDate = new Date(leaderboardEpochTime)

  const daysDifference = Math.floor(
    (overpassEpochTime - leaderboardEpochTime) / (1000 * 60 * 60 * 24)
  )

  return {
    overpassDate: overpassDate,
    leaderboardDate: leaderboardDate,
    daysDifference:
      daysDifference === 0 ? 'up-to-date' : `${daysDifference} days behind`,
  }
}

exports.handler = async (event) => {
  const body = parseEvent(event)
  const responseURL = body.response_url

  try {
    const augmentedDiffsJSON = await fetch(OVERPASS_API_URL)
    const overpassTimestamp = await augmentedDiffsJSON.json()

    const osmStatsJSON = await fetch(OSM_STATS_URL)
    const osmStatsObj = await osmStatsJSON.json()
    const leaderboardTimestamp = osmStatsObj[1].id

    const {
      overpassDate,
      leaderboardDate,
      daysDifference,
    } = calculateTimestampDifference(overpassTimestamp, leaderboardTimestamp)

    const slackMessage = {
      text: `The Leaderboard has been last updated on ${leaderboardDate}. The latest available data is from ${overpassDate}. The Leaderboard is ${daysDifference}.`,
      response_type: 'ephemeral',
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
      body: JSON.stringify('Something went wrong with your request'),
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
