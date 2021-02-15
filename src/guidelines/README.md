# /guidelines Slack slash command
This command finds the HOTOSM Slack guidelines pdf in the workspace and displays a link to open the file to the user who types it. 

## How to use
Write `/guidelines` in the message field of any Slack channel or direct message. The result will be shown only to the user who called the command.

## Dependencies
This command utilises the [Slack Web API with Node](https://slack.dev/node-slack-sdk/web-api) to search for the `Guidelines on Slack channels.pdf` using the [search.files](https://api.slack.com/methods/search.files) method. 

## Expected results


