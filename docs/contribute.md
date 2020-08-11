# Contribute
## Picking up issues to complete in existing commands and features
1. Leave a comment on the GitHub issue that you want to work on to be assigned to it
2. Fork repo
3. Create your own branch
4. `npm install` inside the command directory
5. Create changes needed in lambda file
6. Check [Dev Setup](https://github.com/hotosm/slack-bots/blob/master/docs/dev-setup.md) and try out the command in Slack to make sure it is working as intended
7. Run unit tests to make sure everything still passes
8. Create additional unit tests, if needed
9. Submit pull request


## Creating new Slack slash command
1. Submit GitHub issue with short description of command and what it is trying to solve.
2. Fork repo.
3. Create your own branch.
4. Create a copy of the `new-command` directory which already has boilerplate files and code to help you get started (if you do this, you can skip steps 5-8 and instead edit the files already in the folder). 
5. Create command directory (kebab-case and using the same name as command).
6. `npm init` and setup new `package.json`, if needed.
7. Create folder called 'cloudformation' to store CloudFormation template.
8. Create Cloudformation template (look at other command cfn templates as a guide), the following parameters and resources are required:
    * BucketName parameter (default: `'stork-us-east-1'`)
    * GitSha parameter
    * Lambda function resource
    * Lambda IAM role resource
    * Lambda permission resource allowing the SNS to call the handler
    * SNS topic resource (topic name need to match the command in Slack—e.g. the SNS topic for the `health-tm` slash command needs to also be named `health-tm`)
9. Code Lambda handler.
10. Check [Dev Setup](https://github.com/hotosm/slack-bots/blob/master/docs/dev-setup.md) and try out the command in Slack to make sure it is working as intended.
11. Create unit tests. Test all event paths that your command may take, including all error messages.
12. Create README.md file, see `./src/new-command/README.md` for guide on what you need to include.
13. Edit `./src/command-help/command-help-lambda.js` and include your new command including a short description.
14. Submit pull request.


## Creating other Slackbot features
Apart from Slack slash commands, you may be interested in adding other features and integrations to the Slackbot, please submit a GitHub issue for your idea specifying:
  + What problem your idea is trying to solve
  + How does the solution fit into the current architecture
  + Integrations needed with other tools, APIs etc.
  + AWS resources needed, if any

---

### Boilerplate new command directory
`./src/new-command` is a boilerplate directory contributors can use when creating a new Slack slash command.

**Make sure you change all placeholders in the CloudFormation template and `package.json` with the correct information about your new command.**

It contains:
+ CloudFormation template which creates an SNS topic, Lambda function with basic permissions, and Lambda permission which allows the SNS to call the Lambda
+ Lambda handler file which contains helper functions to get you started
+ `package.json` with `node-fetch` which is used to send messages to Slack


### CloudFriend and cfn-config
MapBox has created [Cloudfriend](https://github.com/mapbox/cloudfriend) and [cfn-config](https://github.com/mapbox/cfn-config) to make it easier to create, deploy, and update CloudFormation templates.


### Working with HOT tools
If you are working with HOT tools such as the Tasking Manager and OSMCha and need a token, please contact @ramyaragupathy and @willemarcel respectively.


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
                "Message": "{\"token\":\"xxxx\",\"team_id\":\"xxxx\",\"team_domain\":\"hotosm\",\"channel_id\":\"xxxx\",\"channel_name\":\"xxxx\",\"user_id\":\"xxxx\",\"user_name\":\"xxxx\",\"command\":\"%2Fcommand-name\",\"text\":\"i+am+a+parameter\",\"response_url\":\"https%3A%2F%2Fhooks.slack.com%2Fcommands%2FT042xxxx%2F1268895xxxxx3%2FxqsA9bJP5JnteuIv8VWou6u8\",\"trigger_id\":\"1267317526581.xxxx.dce29256095d10e5a4c261ed8f57b848\"}",
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

Additionally, if your slash command accepts parameters this can be accessed under `text`. Spaces are replaced by '+' by Slack (e.g. if the user inputs `Charlie Brown` as a parameter you will receive it as `Charlie+Brown`)

---

#### Resources:
[Slack API](https://api.slack.com/)
- [Slash Commands](https://api.slack.com/interactivity/slash-commands)
- [Message Formatting](https://api.slack.com/reference/surfaces/formatting)