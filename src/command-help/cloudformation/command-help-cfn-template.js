const cf = require('@mapbox/cloudfriend')

const Parameters = {
  BucketName: {
    Type: 'String',
    Description: 'Name of S3 bucket where Lambda code is saved',
    Default: 'slack-bot-commands',
  },
  GitSha: {
    Type: 'String',
    Description: 'Git SHA of latest commit for Lambda function',
  },
}

const Resources = {
  CommandHelpSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'command-help',
      Subscription: [
        {
          Endpoint: cf.getAtt('CommandHelp', 'Arn'),
          Protocol: 'lambda',
        },
      ],
      Tags: [
        { Key: 'Name', Value: 'command-help-sns' },
        { Key: 'Tool', Value: 'slackbot' },
        { Key: 'Environment', Value: cf.stackName },
      ],
    },
  },
  CommandHelpPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('CommandHelp'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('CommandHelpSNS'),
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'CommandHelp',
  Handler: 'src/command-help/command-help-lambda.handler',
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: 'command-help.zip',
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
  Tags: [
    { Key: 'Name', Value: 'command-help-lambda' },
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
