const cf = require('@mapbox/cloudfriend')

const Resources = {
  OsmChaStatsLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'osmcha-stats',
      Handler: 'osmcha-stats-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-slack-router-role-4hs4dpro'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'osmcha-stats.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
  OsmChaStatsSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'osmcha-stats',
      Subscription: [
        {
          Endpoint: cf.getAtt('OsmChaStatsLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
    },
  },
  OsmChaStatsPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('OsmChaStatsLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('OsmChaStatsSNS'),
    },
  },
}

module.exports = { Resources }
