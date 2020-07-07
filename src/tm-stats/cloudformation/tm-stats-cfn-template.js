const cf = require('@mapbox/cloudfriend')

const Resources = {
  TmStatsLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'tm-stats',
      Handler: 'tm-stats-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-slack-router-role-4hs4dpro'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'tm-stats.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
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

module.exports = { Resources }
