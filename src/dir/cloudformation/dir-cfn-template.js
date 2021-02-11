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
  DirSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'dir',
      Subscription: [
        {
          Endpoint: cf.getAtt('DirLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
      Tags: [
        { Key: 'Name', Value: 'dir-sns' },
        { Key: 'Project', Value: 'slackbot' },
      ],
    },
  },
  DirPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('DirLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('DirSNS'),
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'DirLambda',
  Handler: 'dir/dir-lambda.handler',
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: "dir.zip",
  },
  Environment: {
    Variables: {
      SLACK_TOKEN: '{{resolve:secretsmanager:slackbots/secret/slacktoken:SecretString:SLACK_TOKEN}}',
    }
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
  Tags: [
    { Key: 'Name', Value: 'dir-lambda' },
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
