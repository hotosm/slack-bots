# Development Setup
To try out your Slackbot slash command or feature, you will have to create your AWS CloudFormation stack and create a Slack App.

**Note that these instructions assume that you already have a CloudFormation template and Lambda file.**

Check out the [contribute docs](https://github.com/hotosm/slack-bots/blob/master/docs/contribute.md) for the steps needed before you can create your CloudFormation stack.

## Create a Slack App
1. Create your Slack app by going to the [Slack API website](https://api.slack.com/) and clicking 'Start Building'.
2. Name your app and choose the desired Slack Workspace you want to use your app in—we recommend setting up a personal Slack Workspace to test your command in.
3. Go to **Basic Information** and under **App Credentials**, copy the *Signing Secret*
4. Head to your Systems Manager AWS Console and in the Parameter Store create a new parameter:
   + For name, input `slack-router-signing-secret`
   + For type, choose `SecureString` 
   + For value, paste the *Slack Signing Secret*
5. Follow the instructions on how to **Create AWS CloudFormation stack** below.
6. Under **Features**, choose **Slash Commands** and click **Create New Command**.
7. Fill out the details. Under the *Request URL* field, paste the URL you copied earlier. Save your changes.
8. Make sure the app is installed in your workspace (under **Basic Information**, *Add features and functionality* and *Install your app to your workspace* should have a checkmark).
9. Head to your chosen Slack workspace and try out your Slack slash command.

## Create AWS CloudFormation stack
There are numerous ways to create a CloudFormation stack:
  + What we recommend: [Using Mapbox's cfn-config](https://github.com/mapbox/cfn-config)
  + [Using the CloudFormation AWS console](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-using-console.html)
  + [Using the AWS Command Line Interface (CLI)](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-using-cli.html)

To create the CloudFormation stack using your own AWS account, you will need to change the `Code` property for the Lambda resource in your CloudFormation templates to point to an S3 bucket in your account.

For the `slack-router` Lambda, upload to your S3 bucket the [`./cloudformation/slack-router-lambda.js`](https://github.com/hotosm/slack-bots/blob/master/cloudformation/slack-router-lambda.js) file.

Once you are ready to submit a pull request, change the `Code` property to follow the CloudFormation template in [`./src/new-command/cloudformation/command-name-cfn-template.js`](https://github.com/hotosm/slack-bots/blob/master/src/new-command/cloudformation/command-name-cfn-template.js) which uses the `BucketName` and `GitSha` parameters.

**Make sure the `Handler` property for your Lambda resources has the correct path to the Lambda file.**

The whole repo is automatically deployed after every commit to a HOT S3 bucket which is why for the handler we need to specify a path starting from the root of the repo (e.g. `Handler: 'src/command-name/command-name-lambda.handler'`).

1. Create the CloudFormation stack for `slack-router`. You can find the CloudFormation template for this in [`./cloudformation/slack-router-cfn-template.js`](https://github.com/hotosm/slack-bots/blob/master/cloudformation/slack-router-cfn-template.js). This will create the API Gateway resources and router Lambda needed to route commands to the correct SNS topic and Lambda.
2. Create the CloudFormation stack for the command you are working on.
3. Go to the AWS CloudFormation console and check that all your resources have been created properly.
4. Check that the SNS topic and Lambda for your command are connected.
5. Get the invoke URL for the `slack-router` API in the AWS API Gateway console. Append the route `/slack-to-lambda` to the end of the URL and copy.
6. Go to your app's dashboard in the [Slack API website](https://api.slack.com/apps) and follow instructions number 6-9 on how to **Create a Slack App** above.

### Troubleshooting
  + The logs for your command can be accessed in CloudWatch Log groups.
  + If you are modifying an existing command, some variables may be stored in HOT's AWS Systems Manager, comment in the issue ticket and tag @ramyaragupathy to get access.