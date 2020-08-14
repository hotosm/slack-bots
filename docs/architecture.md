# Architecture and structure
![slack-router](https://user-images.githubusercontent.com/12103383/84057200-f6620000-a9d4-11ea-9b74-fd4ecd9eb27b.png)

The application has a routing setup for the different Slack bots which means every feature is deployed and runs independently of each other.

When an event is triggered, 
* either automatically such as GitHub events which uses webhooks or 
* by a user such as in Slack slash commands, the event payload is sent to the appropriate API endpoint.

From the endpoint, it is then sent to a routing Lambda which will publish the payload to the correct SNS topic as well as send back any needed response to the event source—e.g. a `status 200` back to Slack for slash commands.

The SNS topic will send the payload to the Lambda that is subscribed to it which will handle the application logic needed and send a message to Slack for users to see.