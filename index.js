require('dotenv').load()
// Initialize http
const http = require('http')
// Initialize the Slack Events API using signing secret from environment variables
const createEventAdapter = require('@slack/events-api').createEventAdapter
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET)
const port = process.env.PORT || 3000
// Initialize the Web API Client
const { WebClient } = require('@slack/client')
const token = process.env.SLACK_TOKEN
const slackWeb = new WebClient(token)
// Setting Up Express to be used with the Events API
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const message = {
  'text': "Welcome to HOTOSM Slack @user! HOT is an international team dedicated to humanitarian action and community development through open mapping. Great to have you here!"
  
}

// Setting up this route to be used with the Slack Events middleware
app.use('/slack/events', slackEvents.expressMiddleware())
// Attach listeners to events by Slack Event "type".
slackEvents.on('message', (event) => {
  console.log(`Received a team_join event: user ${event.user.name} has joined.`)
  console.log(JSON.stringify(event))
  slackWeb.chat.postMessage({
    channel: event.channel,
    text: message.text,
    attachments: message.attachments
  }).then((res) => {
    console.log(`Message sent: ${res.ts}`)
  }).catch(console.error)
})

// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error)
// Start a basic HTTP server
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`)
})
