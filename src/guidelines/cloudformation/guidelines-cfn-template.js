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
  GuidelinesSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'guidelines',
      Subscription: [
        {
          Endpoint: cf.getAtt('GuidelinesLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
      Tags: [
        { Key: 'Name', Value: 'guidelines-sns' },
        { Key: 'Project', Value: 'slackbot' },
      ],
    },
  },
  GuidelinesPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('GuidelinesLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('GuidelinesSNS'),
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'GuidelinesLambda',
  Handler: 'guidelines/guidelines-lambda.handler',
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: "guidelines.zip",
  },
  Environment: {
    Variables: {
      SLACK_TOKEN: '{{resolve:secretsmanager:slackbots/secret/slacktoken:SecretString:SLACK_TOKEN}}',
    }
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
  Tags: [
    { Key: 'Name', Value: 'guidelines-lambda' },
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
