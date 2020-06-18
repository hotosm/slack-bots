const cf = require('@mapbox/cloudfriend')

const Resources = {
  HealthTmLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'health-tm',
      Handler: 'health-tm-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-slack-router-role-4hs4dpro'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'health-tm.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
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

module.exports = { Resources }
