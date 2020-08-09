# Slack Bot

## Description
This slackbot projects has a routing setup for Slack bots, parsing and forwarding incoming messages to respective bots and all these are handled asynchronously. All the Slack bots utilises the data from various API endpoints to implement commands and automate tasks to improve HOT's internal communications and make it easier for members to get information from HOT tools.

[Contribution]() | [Existing slash commands]() | [Architecture details]()

### Folder structure
Each commands has its own folder within the repo containing its own `package.json` if needed, cloudformation folder containing the command's cfn template, ReadMe file, and everything else that the command needs to function.

E.g.

```
.
├── README.md
├── cloudformation
│   └── slack-router-cfn-template.js
│   └── slack-router-lambda.js
├── package.json
└── src
    ├── health-leaderboard
    │   ├── README.md
    │   ├── cloudformation
    │   │   └── health-leaderboard-cfn-template.js
    │   ├── health-leaderboard-lambda.js
    │   └── package.json
    ├── health-tm
    │   ├── README.md
    │   ├── cloudformation
    │   │   └── health-tm-cfn-template.js
    │   ├── health-tm-lambda.js
    │   └── package.json
    ├── new-command
        ├── README.md
        ├── cloudformation
        │    └── new-command-cfn-template.js
        ├── new-command-lambda.js
        └── package.json

```

