const cf = require('@mapbox/cloudfriend')

const Parameters = {
  LambdaGitSha: {
    Type: 'String',
    Description: 'Git SHA of latest commit for Lambda function',
  },
}

const Resources = {
  SlackRouterLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'slack-api-sns-router',
      Handler: '/cloudformation/slack-router-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-api-lambda-sns-role-6ndj69lt'
      ),
      Code: {
        S3Bucket: 'stork-us-east-1',
        S3Key: cf.join('', [
          'bundles/slack-bots/',
          cf.ref('LambdaGitSha'),
          '.zip',
        ]),
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
}

module.exports = { Parameters, Resources }
