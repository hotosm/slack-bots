const cf = require('@mapbox/cloudfriend')

const Resources = {
  SlackRouterApi: {
    Type: 'AWS::ApiGatewayV2::Api',
    Properties: {
      Name: 'slack-router-api',
      ProtocolType: 'HTTP',
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
  SlackRouterLambda: {
    Type: 'AWS::Lambda::Function',
    Properties: {
      FunctionName: 'slack-router-lambda',
      Handler: 'slack-router-lambda.handler',
      Role: cf.sub(
        'arn:aws:iam::${AWS::AccountId}:role/service-role/test-api-lambda-sns-role-6ndj69lt'
      ),
      Code: {
        S3Bucket: 'lambda-andria',
        S3Key: 'slack-router-lambda.zip',
      },
      Runtime: 'nodejs12.x',
      Timeout: '30',
    },
  },
  SlackRouterPermission: {
    Type: 'AWS::Lambda::Permission',
    Properties: {
      Action: 'lambda:InvokeFunction',
      FunctionName: cf.ref('SlackRouterLambda'),
      Principal: 'apigateway.amazonaws.com',
      SourceArn: cf.join('', [
        'arn:',
        cf.partition,
        ':execute-api:',
        cf.region,
        ':',
        cf.accountId,
        ':',
        cf.ref('SlackRouterApi'),
        '/*/*',
      ]),
    },
  },
}

module.exports = { Resources }
