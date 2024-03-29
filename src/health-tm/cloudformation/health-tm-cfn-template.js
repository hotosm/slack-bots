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
  HealthTmSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'health-tm',
      Subscription: [
        {
          Endpoint: cf.getAtt('HealthTmLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
      Tags: [
        { Key: 'Name', Value: 'health-tm-sns' },
        { Key: 'Tool', Value: 'slackbot' },
        { Key: 'Environment', Value: cf.stackName },
      ],
    },
  },
  HealthTmPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('HealthTmLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('HealthTmSNS'),
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'HealthTmLambda',
  Handler: 'health-tm/health-tm-lambda.handler',
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: 'health-tm.zip',
  },
  Environment: {
    Variables: {
      TM_API_BASE_URL: '{{resolve:ssm:tasking-manager-api-url:1}}',
    },
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
  Tags: [
    { Key: 'Name', Value: 'health-tm-lambda' },
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
