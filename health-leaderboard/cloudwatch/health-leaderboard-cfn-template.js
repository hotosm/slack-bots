const cf = require('@mapbox/cloudfriend')

const Resources = {
  HealthLeaderboardLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'health-leaderboard',
      Handler: 'health-leaderboard-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-slack-router-role-4hs4dpro'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'health-leaderboard.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
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

module.exports = { Resources }
