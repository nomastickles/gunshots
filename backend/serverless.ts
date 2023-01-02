import type { AWS } from "@serverless/typescript";
import * as constants from "./src/constants";
const serverlessConfiguration: AWS = {
  service: "gunshots",
  frameworkVersion: "3",
  custom: {
    output: {
      handler: "scripts/stackOutput.handler",
    },
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: {
        forceExclude: ["aws-sdk"],
      },
    },
    ACCOUNT_ID: "${env:ACCOUNT_ID}",
    S3_NAME: "${env:S3_NAME}-${self:service}-${self:provider.stage}", // public facing
    SNS_UPLOAD_NAME: "${self:service}-upload-${self:provider.stage}",
    SNS_SEND_INCIDENTS_NAME: "${self:service}-send-${self:provider.stage}",
    SNS_SEND_INCIDENTS_ARN_PREFIX:
      "arn:aws:sns:${self:provider.region}:${self:custom.ACCOUNT_ID}",
    SSM_PATH_GOOGLE_KEY: "/gunshots/googleAPIKey",
  },
  plugins: [
    "serverless-webpack",
    "serverless-iam-roles-per-function",
    "serverless-stack-output",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    stage: "${opt:stage, 'dev'}",
    region: "${env:AWS_DEFAULT_REGION}" as any,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      DB_NAME: "${self:service}-${self:provider.stage}",
      DB_NAME_GSPK: "GSPK-GSSK-index",
    },
    logRetentionInDays: 3,
    memorySize: 256,
    timeout: 120,
    versionFunctions: false,
  },
  resources: {
    Resources: {
      S31: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:custom.S3_NAME}",
        },
      },
      DynamoDB1: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          TableName: "${self:provider.environment.DB_NAME}",
          AttributeDefinitions: [
            {
              AttributeName: "PK",
              AttributeType: "S",
            },
            {
              AttributeName: "GSPK",
              AttributeType: "S",
            },
            {
              AttributeName: "GSSK",
              AttributeType: "N",
            },
          ],
          KeySchema: [
            {
              AttributeName: "PK",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: constants.DynamoDBReadCapacityUnits,
            WriteCapacityUnits: constants.DynamoDBWriteCapacityUnits,
          },
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.DB_NAME_GSPK}",
              Projection: {
                ProjectionType: "ALL",
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: constants.DynamoDBReadCapacityUnits,
                WriteCapacityUnits: constants.DynamoDBWriteCapacityUnits,
              },
              KeySchema: [
                {
                  AttributeName: "GSPK",
                  KeyType: "HASH",
                },
                {
                  AttributeName: "GSSK",
                  KeyType: "RANGE",
                },
              ],
            },
          ],
        },
      },
    },
  },
  functions: {
    connectionManager: {
      maximumRetryAttempts: 0,
      handler: "src/functions/connectionManager.default",
      environment: {
        SNS_TOPIC_SEND_INCIDENTS:
          "${self:custom.SNS_SEND_INCIDENTS_ARN_PREFIX}:${self:custom.SNS_SEND_INCIDENTS_NAME}",
      },
      events: [
        {
          websocket: {
            route: "$connect",
          },
        },
        {
          websocket: {
            route: "$disconnect",
          },
        },
      ],
      // @ts-expect-error
      iamRoleStatements: [
        {
          Effect: "Allow",
          Action: ["execute-api:ManageConnections"],
          Resource:
            "arn:aws:execute-api:${self:provider.region}:${self:custom.ACCOUNT_ID}:*/@connections/*",
        },
        {
          Effect: "Allow",
          Action: [
            "dynamodb:PutItem",
            "dynamodb:DeleteItem",
            // "dynamodb:GetItem",
            // "dynamodb:UpdateItem"
            // "dynamodb:Query",
            // "dynamodb:Scan"
          ],
          Resource:
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}",
        },
        {
          Effect: "Allow",
          Action: ["sns:Publish"],
          Resource:
            "${self:custom.SNS_SEND_INCIDENTS_ARN_PREFIX}:${self:custom.SNS_SEND_INCIDENTS_NAME}",
        },
      ],
    },
    sendIncidents: {
      handler: "src/functions/sendIncidents.default",
      maximumRetryAttempts: 0,
      events: [
        {
          sns: "${self:custom.SNS_SEND_INCIDENTS_NAME}",
        },
      ],
      // @ts-expect-error
      iamRoleStatements: [
        {
          Effect: "Allow",
          Action: ["execute-api:ManageConnections"],
          Resource:
            "arn:aws:execute-api:${self:provider.region}:${self:custom.ACCOUNT_ID}:*/@connections/*",
        },
        {
          Effect: "Allow",
          Action: ["sns:Subscribe", "sns:GetTopicAttributes"],
          Resource:
            "${self:custom.SNS_SEND_INCIDENTS_ARN_PREFIX}:${self:custom.SNS_SEND_INCIDENTS_NAME}",
        },
        {
          Effect: "Allow",
          Action: [
            // "dynamodb:PutItem",
            "dynamodb:DeleteItem",
            "dynamodb:GetItem",
            // "dynamodb:UpdateItem"
            // "dynamodb:Query",
            // "dynamodb:Scan"
          ],
          Resource:
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}",
        },
        {
          Effect: "Allow",
          Action: [
            // "dynamodb:PutItem",
            // "dynamodb:DeleteItem",
            // "dynamodb:GetItem",
            // "dynamodb:UpdateItem"
            "dynamodb:Query",
            // "dynamodb:Scan"
          ],
          Resource:
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}/index/${self:provider.environment.DB_NAME_GSPK}",
        },
      ],
    },
    uploadIncidents: {
      handler: "src/functions/uploadIncidents.default",
      maximumRetryAttempts: 0,
      timeout: 900,
      environment: {
        SNS_TOPIC_SEND_INCIDENTS:
          "${self:custom.SNS_SEND_INCIDENTS_ARN_PREFIX}:${self:custom.SNS_SEND_INCIDENTS_NAME}",
        S3_NAME: "${self:custom.S3_NAME}",
        SSM_PATH_GOOGLE_KEY: "${self:custom.SSM_PATH_GOOGLE_KEY}",
      },
      events: [
        {
          sns: "${self:custom.SNS_UPLOAD_NAME}",
        },
      ],
      // @ts-expect-error
      iamRoleStatements: [
        {
          Effect: "Allow",
          Action: ["sns:Subscribe", "sns:GetTopicAttributes"],
          Resource:
            "arn:aws:sns::${self:custom.ACCOUNT_ID}:${self:custom.SNS_UPLOAD_NAME}",
        },
        {
          Effect: "Allow",
          Action: [
            "dynamodb:PutItem",
            // "dynamodb:DeleteItem",
            "dynamodb:GetItem",
            // "dynamodb:UpdateItem"
            // "dynamodb:Query",
            // "dynamodb:Scan"
          ],
          Resource:
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}",
        },
        {
          Effect: "Allow",
          Action: ["s3:ListBucket"],
          Resource: "arn:aws:s3:::${self:custom.S3_NAME}",
        },
        {
          Effect: "Allow",
          Action: ["s3:PutObject", "s3:PutObjectAcl", "s3:DeleteObject"],
          Resource: "arn:aws:s3:::${self:custom.S3_NAME}/*",
        },
        {
          Effect: "Allow",
          Action: ["sns:Publish"],
          Resource:
            "${self:custom.SNS_SEND_INCIDENTS_ARN_PREFIX}:${self:custom.SNS_SEND_INCIDENTS_NAME}",
        },
        {
          Effect: "Allow",
          Action: ["ssm:GetParameter"],
          Resource:
            "arn:aws:ssm:${self:provider.region}:${self:custom.ACCOUNT_ID}:parameter${self:custom.SSM_PATH_GOOGLE_KEY}",
        },
      ],
    },
  },
};

module.exports = serverlessConfiguration;
