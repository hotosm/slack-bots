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
  SlackRouterApi: {
    Type: 'AWS::ApiGatewayV2::Api',
    Properties: {
      Name: 'slack-router-api',
      ProtocolType: 'HTTP',
      Tags: {
        "Name":"slack-router-api",
        "Project":"slackbot-router"
      }
    },
  },
  SlackToLambdaIntegration: {
    Type: 'AWS::ApiGatewayV2::Integration',
    Properties: {
      ApiId: cf.ref('SlackRouterApi'),
      Description: 'Integration for Slack Slash Commands',
      IntegrationType: 'AWS_PROXY',
      IntegrationUri: cf.join('', [
        'arn:',
        cf.partition,
        ':apigateway:',
        cf.region,
        ':lambda:path/2015-03-31/functions/',
        cf.getAtt('SlackRouterLambda', 'Arn'),
        '/invocations',
      ]),
      PayloadFormatVersion: '2.0',
    },
  },
  SlackToLambdaRoute: {
    Type: 'AWS::ApiGatewayV2::Route',
    Properties: {
      ApiId: cf.ref('SlackRouterApi'),
      AuthorizationType: 'NONE',
      RouteKey: 'POST /slack-to-lambda',
      Target: cf.join('/', [
        'integrations',
        cf.ref('SlackToLambdaIntegration'),
      ]),
    },
  },
  SlackToLambdaDeploy: {
    Type: 'AWS::ApiGatewayV2::Deployment',
    DependsOn: 'SlackToLambdaRoute',
    Properties: {
      ApiId: cf.ref('SlackRouterApi'),
    },
  },
  SlackRouterApiProdStage: {
    Type: 'AWS::ApiGatewayV2::Stage',
    Properties: {
      ApiId: cf.ref('SlackRouterApi'),
      AutoDeploy: 'true',
      DeploymentId: cf.ref('SlackToLambdaDeploy'),
      StageName: 'prod',
    },
  },
  SlackRouterPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('SlackRouterLambda'),
      Principal: 'apigateway.amazonaws.com',
      SourceArn: cf.arn(
        'execute-api',
        cf.join('', [cf.ref('SlackRouterApi'), '/*/*'])
      ),
    },
  },
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'SlackRouterLambda',
  Handler: 'cloudformation/slack-router-lambda.handler',
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
  Statement: [
    {
      Effect: 'Allow',
      Action: 'ssm:GetParameter',
      Resource: cf.sub(
        'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/slack-router-signing-secret'
      ),
    },
  ],
  Tags: [
    { Key: 'Name', Value: 'slack-router-lambda' },
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
