const cf = require('@mapbox/cloudfriend')

const Resources = {
  OsmChaStatsProjectLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'osmcha-stats-project',
      Handler: 'osmcha-stats-project-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-slack-router-role-4hs4dpro'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'osmcha-stats-project.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
  OsmChaStatsProjectSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'osmcha-stats-project',
      Subscription: [
        {
          Endpoint: cf.getAtt('OsmChaStatsProjectLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
    },
  },
  OsmChaStatsProjectPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('OsmChaStatsProjectLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('OsmChaStatsProjectSNS'),
    },
  },
}

module.exports = { Resources }
