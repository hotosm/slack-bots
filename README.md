# Slack Bot

## Description
This Slack bot utilises the Slack API to implement commands and automate tasks to improve HOT's internal communications and make it easier for members to get information from HOT tools.

## Architecture and structure
![slack-router](https://user-images.githubusercontent.com/12103383/84057200-f6620000-a9d4-11ea-9b74-fd4ecd9eb27b.png)

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

## Existing commands and features
### Slash Commands
* [`/health-tm`](https://github.com/hotosm/slack-bots/tree/master/src/health-tm) - Return the status of the Tasking Manager and other stats

* [`/health-leaderboard`](https://github.com/hotosm/slack-bots/tree/master/src/health-leaderboard) - Returns the status of the Missing Maps Leaderboard

* [`/osmcha-stats`](https://github.com/hotosm/slack-bots/tree/master/src/osmcha-stats) - Returns stats on changesets filtered based on project ID or hashtag(s)

* [`/tm-stats`](https://github.com/hotosm/slack-bots/tree/master/src/tm-stats) - Returns stats on the Tasking Manager, projects, or users

### Features
* Github label filter ?
* Welcome bot ?

## Contribute
### Picking up issues to complete in existing commands
1. Fork repo
2. Create your own branch
3. `npm install` inside the command directory
4. Create changes needed in lambda file
5. Submit pull request

### Creating new command
1. Fork repo
2. Create your own branch
3. Create command directory (kebab-case and using the same name as command)
4. `npm init` and setup new `package.json`
5. Create folder called 'cloudformation' to store CloudFormation template
6. Create Cloudformation template, the following resources are required:
    * Lambda function
    * Lambda IAM role
    * Lambda permission allowing the SNS to call the handler
    * SNS (SNS name need to match the command in Slack)
7. Create Lambda handler
8. Submit pull request

#### CloudFriend and cfn-config
MapBox has created [Cloudfriend](https://github.com/mapbox/cloudfriend) and [cfn-config](https://github.com/mapbox/cfn-config) to make it easier to create, deploy, and update CloudFormation templates.

### Testing
Talk about testing


### Working with HOT tools
If you are working with HOT tools such as the Tasking Manager and OSMCha and need a token, please contact _________.

### Slack Slash Commands - Event payload that your Lambda will receive 
When working with Slack slash commands, the event object that the command lambda will receive from its SNS pair will have the following format:
```
{
    "Records": [
        {
            "EventSource": "aws:sns",
            "EventVersion": "1.0",
            "EventSubscriptionArn": "arn:xxx",
            "Sns": {
                "Type": "Notification",
                "MessageId": "98e47b55-xxxx-xxxx-xxxx-2ccf3ad46aa5",
                "TopicArn": "arn:xxx",
                "Subject": "SNS from Slack Slash Command",
                "Message": "{\"token\":\"xxxx\",\"team_id\":\"xxxxx\",\"team_domain\":\"hotosm\",\"channel_id\":\"xxxxx\",\"channel_name\":\"xxxxx",\"user_id\":\"xxxx\",\"user_name\":\"xxxx\",\"command\":\"%2Fcommand-name\",\"text\":\"i+am+a+parameter\",\"response_url\":\"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042xxxxx%2F1261935219462%2FYA9Hj7eqaYD29KiZMkp1AP2l\",\"trigger_id\":\"1292506069872.xxxx.e141f08809a67f8295815147128ca318\"}",
                "Timestamp": "2020-xx-xxT01:34:14.148Z",
                "SignatureVersion": "1",
                "Signature": "xxxxxx",
                "SigningCertUrl": "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-xxxx.pem",
                "UnsubscribeUrl": "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:xxxx",
                "MessageAttributes": {}
            }
        }
    ]
}
```
From this, extract `event.Records[0].Sns.Message` to get the message payload sent by Slack.

You will then need to extract the `response_url` to send the message you want the user to see to Slack. The URL is encoded so you will need to use [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent). 

Additionally, if your slash command accepts parameters this can be accessed under `text`. Spaces are replaced by '+' by Slack (e.g. if the user inputs 'Charlie Brown' as a parameter you will receive it as 'Charlie+Brown')


#### Resources:
[Slack API](https://api.slack.com/)
- [Slash commands](https://api.slack.com/interactivity/slash-commands)
- [Message Formatting](https://api.slack.com/reference/surfaces/formatting)