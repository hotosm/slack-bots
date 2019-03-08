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
  'text': "Welcome to HOTOSM Slack @user! HOT is an international team dedicated to humanitarian action and community development through open mapping.\

  Here are some handy links to get started in the community:\
  \
  \
  - HOTOSM website is where you’ll learn more about our [projects](https://www.hotosm.org/our-work) & [tools](https://www.hotosm.org/tools-and-data) \
  - We communicate & post updates in public channel. If you have questions/ideas, this is the best way to contact the community. Here’s a quick list of a few popular channels:\
    - #disaster-mapping → discussion about mapping project activation & contribution, contact @coordinators \
    - #mappers-support → mapping & validation related \
    - #tasking_manager_3 → reach out to @tech \
    - #export-tool \
    - #field-campaigner \
    - #openaerialmap \
    - #gsoc18 → coordination group for GSOC \
    - #outreachy → coordination group for Outreachy program \
    - #starter-issues → Identifying issues to contribute to across HOTOSM tech stack \
    - #developers → any tech related discussion \
  - Tasking Manager  is the primary tool for mapping project coordination.  Here’s all the projects that the community has been building on  https://tasks.hotosm.org/contribute?difficulty=ALL \
  - Check out our GitHub page to get an overview of what the tech community is working on. https://github.com/hotosm/ \
  - All community members are expected to participate & collaborate in line with our code of conduct. https://www.hotosm.org/code-of-conduct \
  \
  Great to have you here!\
  "
  
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
    // store the user's data
    fs.readFile('database.json', (err, data) => {
      if (err) throw err
      // read the data into your program to be read
      let usersSent = JSON.parse(data)
      // build the object for a specific user to save
      usersSent[event.user.id] = {
        'time_sent': res.message.ts,
        'accepted': false,
        'time_accepted': ''
      }
      // And finally, string up the data, write it back to file!
      let stringifiedUsersSent = JSON.stringify(usersSent)
      fs.writeFile('database.json', stringifiedUsersSent, () => {
        if (err) throw err
        console.log(`data saved for user ${event.user.id}`)
      })
    })
  }).catch(console.error)
})
app.post('/slack/button', bodyParser.urlencoded({ extended: true }), (req, res) => {
  const sendData = JSON.parse(req.body.payload)
  const user = sendData.user.id
  const timeAccepted = sendData.action_ts
  fs.readFile('database.json', (err, data) => {
    if (err) throw err
    let acceptDatabase = JSON.parse(data)
    acceptDatabase[user].accepted = true
    acceptDatabase[user].time_accepted = timeAccepted
    let stringifiedAcceptDatabase = JSON.stringify(acceptDatabase)
    fs.writeFile('database.json', stringifiedAcceptDatabase, (err) => {
      if (err) throw err
      res.sendStatus(200)
      console.log(`${user} has accepted the code of conduct.`)
      slackWeb.chat.update({
        channel: sendData.channel.id,
        ts: sendData.message_ts,
        attachments: [sendData.original_message.attachments[0], updatedCodeOfConduct]
      }).then(() => {
        console.log(`Message updated! ${timeAccepted}`)
      }).catch(console.error)
    })
  })
})
// Handle errors (see `errorCodes` export)
slackEvents.on('error', console.error)
// Start a basic HTTP server
http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`)
})
