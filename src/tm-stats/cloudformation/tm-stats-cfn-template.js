const cf = require('@mapbox/cloudfriend')

const Resources = {
  TmStatsProjectLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'tm-stats-project',
      Handler: 'tm-stats-project-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-slack-router-role-4hs4dpro'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'tm-stats-project.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
  TmStatsProjectSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'tm-stats-project',
      Subscription: [
        {
          Endpoint: cf.getAtt('TmStatsProjectLambda', 'Arn'),
          Protocol: 'lambda',
        },
      ],
    },
  },
  TmStatsProjectPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('TmStatsProjectLambda'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('TmStatsProjectSNS'),
    },
  },
}

module.exports = { Resources }
