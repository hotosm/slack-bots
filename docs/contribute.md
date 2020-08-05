## Contribute
### Picking up issues to complete in existing commands and features
1. Leave a comment on the GitHub issue that you want to work on to be assigned to it
2. Fork repo
3. Create your own branch
4. `npm install` inside the command directory
5. Create changes needed in lambda file
6. Run unit tests to make sure everything still passes
7. Create more unit tests if needed
8. Submit pull request

### Creating new Slack slash command
1. Fork repo
2. Create your own branch
3. Create command directory (kebab-case and using the same name as command)
4. `npm init` and setup new `package.json`, if needed
5. Create folder called 'cloudformation' to store CloudFormation template
6. Create Cloudformation template, the following resources are required:
    * Lambda function
    * Lambda IAM role
    * Lambda permission allowing the SNS to call the handler
    * SNS Topic (topic name need to match the command in Slack—e.g. the SNS topic for the `health-tm` slash command needs to also be named `health-tm`)
7. Create Lambda handler
8. Create unit tests
9. Submit pull request

#### CloudFriend and cfn-config
MapBox has created [Cloudfriend](https://github.com/mapbox/cloudfriend) and [cfn-config](https://github.com/mapbox/cfn-config) to make it easier to create, deploy, and update CloudFormation templates.

### Creating other Slackbot features
Apart from Slack slash commands, you may be interested in adding other features and integrations to the Slackbot, please submit a GitHub issue for your idea specifying:
  + What problem your idea is trying to solve
  + Integrations needed with other tools, APIs etc.
  + AWS resources needed, if any

### Testing
// Talk about testing //


### Working with HOT tools
If you are working with HOT tools such as the Tasking Manager and OSMCha and need a token, please contact //_________//.

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


#### Resources:
[Slack API](https://api.slack.com/)
- [Slash commands](https://api.slack.com/interactivity/slash-commands)
- [Message Formatting](https://api.slack.com/reference/surfaces/formatting)