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
  HealthLeaderboardSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'health-leaderboard',
      Subscription: [
        {
          Endpoint: cf.getAtt('HealthLeaderboardLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
    },
  },
  HealthLeaderboardPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('HealthLeaderboardLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('HealthLeaderboardSNS'),
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'HealthLeaderboardLambda',
  Handler: 'src/health-leaderboard/health-leaderboard-lambda.handler',
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: cf.join('', ['bundles/slack-bots/', cf.ref('GitSha'), '.zip']),
  },
  Environment: {
    Variables: {
      AWS_ACCOUNT_ID: cf.accountId,
    },
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
})

module.exports = module.exports = cf.merge({ Parameters, Resources }, lambda)
