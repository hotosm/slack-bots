const cf = require('@mapbox/cloudfriend')

const Resources = {
  CommandHelp: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'command-help',
      Handler: 'command-help-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-slack-router-role-4hs4dpro'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'command-help.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
  CommandHelpSNS: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'command-help',
      Subscription: [
        {
          Endpoint: cf.getAtt('CommandHelp', 'Arn'),
          Protocol: 'lambda',
        },
      ],
    },
  },
  CommandHelpPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('CommandHelp'),
      Principal: 'sns.amazonaws.com',
      SourceArn: cf.ref('CommandHelpSNS'),
    },
  },
}

module.exports = { Resources }
