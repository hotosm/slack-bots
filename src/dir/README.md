# /dir Slack Slash Command
Displays a file with a categorical list of Slack channels in the HOTOSM workspace, e.g a list of channels for working groups, tech tools, etc

## How to use
Write `/dir` in the message field of any Slack channel or direct message. The result will be shown only to the user who called the command.


## Dependencies
This command utilises [Slack Web API with Node](https://slack.dev/node-slack-sdk/web-api) to search for the uploaded `Slack Channels Directory file` using the [search.files](https://api.slack.com/methods/search.files) method. 


## Expected results
<img width="519" alt="dir_result" src="https://user-images.githubusercontent.com/31903212/120038444-f440e900-c00b-11eb-9ca3-c678e4ec0601.png">

<img width="396" alt="file display" src="https://user-images.githubusercontent.com/31903212/120035540-74b11b00-c007-11eb-992f-9377608af6e8.png">


