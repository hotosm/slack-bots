# Slack Bots

## Description
This Slackbot project has a routing setup for Slack bots, parsing and forwarding incoming messages to respective bots which are all handled asynchronously. All the Slack bots utilise data from various API endpoints to implement commands and automate tasks to improve HOT's internal communications and make it easier for members to get information from HOT tools.

[Contribution](https://github.com/hotosm/slack-bots/blob/master/docs/contribute.md)  | [Dev setup](https://github.com/hotosm/slack-bots/blob/master/docs/dev-setup.md) | [Architecture details](https://github.com/hotosm/slack-bots/blob/master/docs/architecture.md) | [Existing slash commands](https://github.com/hotosm/slack-bots/blob/master/docs/slash-commands.md)

### Folder structure
Each command has its own folder within the repo containing its own `package.json` if needed, cloudformation folder containing the command's cfn template, README file, and everything else that the command needs to function.

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
    │   ├── health-leaderboard-lambda.test.js
    │   └── package.json
    ├── health-tm
    │   ├── README.md
    │   ├── cloudformation
    │   │   └── health-tm-cfn-template.js
    │   ├── health-tm-lambda.js
    │   ├── health-tm-lambda.test.js
    │   └── package.json
    └── new-command
        ├── README.md
        ├── cloudformation
        │    └── new-command-cfn-template.js
        ├── new-command-lambda.js
        ├── new-command-lambda.test.js
        └── package.json

```

