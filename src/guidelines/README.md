# /guidelines Slack slash command
This command finds the HOTOSM Slack guidelines pdf in the workspace and displays a link to open the file to the user who types it. 

## How to use
Write `/guidelines` in the message field of any Slack channel or direct message. The result will be shown only to the user who called the command.

## Dependencies
This command utilises the [Slack Web API with Node](https://slack.dev/node-slack-sdk/web-api) to search for the `Guidelines on Slack channels.pdf` using the [search.files](https://api.slack.com/methods/search.files) method. 

## Expected results
<img width="672" alt="guidelines-command" src="https://user-images.githubusercontent.com/31903212/122890072-092f4480-d34c-11eb-9d7b-ceedaee97978.png">

<img width="362" alt="guidelines response" src="https://user-images.githubusercontent.com/31903212/122890083-0c2a3500-d34c-11eb-9522-33a29fa3a37d.png">
