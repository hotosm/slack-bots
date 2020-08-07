const cf = require('@mapbox/cloudfriend')

const Parameters = {
  BucketName: {
    Type: 'String',
    Description: 'Name of S3 bucket where Lambda code is saved',
    Default: 'stork-us-east-1',
  },
  GitSha: {
    Type: 'String',
    Description: 'Git SHA of latest commit for Lambda function',
  },
}

const Resources = {
  CommandNameSNS: {
    //change name
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'command-name', //change to name of slash command as it is used in Slack
      Subscription: [
        {
          Endpoint: cf.getAtt('CommandNameLambda', 'Arn'), //change to logical name of Lambda (line 45)
          Protocol: 'lambda',
        },
      ],
      Tags: [
        { Key: 'Name', Value: 'command-name-sns' }, // change to name of command
        { Key: 'Project', Value: 'slackbot' },
      ],
    },
  },
  CommandNamePermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('CommandNameLambda'), // change to logical name of Lambda (line 45)
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('CommandNameSNS'), // change to logical name of SNS (line 16)
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'CommandNameLambda', // change to name of command
  Handler: 'src/command-name/command-name-lambda.handler', // change to name of folder and Lambda file in repo
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: cf.join('', ['bundles/slack-bots/', cf.ref('GitSha'), '.zip']),
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
  Tags: [
    { Key: 'Name', Value: 'command-name-lambda' }, // change to name of command
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
