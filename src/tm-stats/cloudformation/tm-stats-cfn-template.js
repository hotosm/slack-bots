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
  TmStatsSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'tm-stats',
      Subscription: [
        {
          Endpoint: cf.getAtt('TmStatsLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
      Tags: [
        { Key: 'Name', Value: 'tm-stats-sns' },
        { Key: 'Project', Value: 'slackbot' },
      ],
    },
  },
  TmStatsPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('TmStatsLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('TmStatsSNS'),
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'TmStatsLambda',
  Handler: 'src/tm-stats/tm-stats-lambda.handler',
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: cf.join('', ['bundles/slack-bots/', cf.ref('GitSha'), '.zip']),
  },
  Environment: {
    Variables: {
      TM_API_BASE_URL: '{{resolve:ssm:tasking-manager-api-url:1}}',
      TM_BASE_URL: '{{resolve:ssm:tasking-manager-url:1}}',
    },
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
  Statement: [
    {
      Effect: 'Allow',
      Action: 'ssm:GetParameter',
      Resource: cf.sub(
        'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/tm-token'
      ),
    },
  ],
  Tags: [
    { Key: 'Name', Value: 'tm-stats-lambda' },
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
