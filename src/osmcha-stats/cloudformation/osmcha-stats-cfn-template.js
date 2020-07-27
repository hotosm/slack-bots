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
}

const lambda = new cf.shortcuts.Lambda({
  LogicalName: 'OsmChaStatsLambda',
  Handler: 'src/osmcha-stats/osmcha-stats-lambda.handler',
  Code: {
    S3Bucket: cf.ref('BucketName'),
    S3Key: cf.join('', ['bundles/slack-bots/', cf.ref('GitSha'), '.zip']),
  },
  Environment: {
    Variables: {
      OSMCHA_BASE_URL: '{{resolve:ssm:osmcha-url:1}}',
      OSMCHA_API_BASE_URL: '{{resolve:ssm:osmcha-api-url:1}}',
      TM_API_BASE_URL: '{{resolve:ssm:tasking-manager-api-url:1}}',
    },
  },
  Runtime: 'nodejs12.x',
  Timeout: '60',
  Statement: [
    {
      Effect: 'Allow',
      Action: 'ssm:GetParameter',
      Resource: cf.sub(
        'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/osmcha-token'
      ),
    },
  ],
  Tags: [
    { Key: 'Name', Value: 'osmcha-stats' },
    { Key: 'Project', Value: 'slackbot' },
  ],
})

module.exports = cf.merge({ Parameters, Resources }, lambda)
