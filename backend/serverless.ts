import type { AWS } from "@serverless/typescript";
import * as constants from "./src/constants";
const serverlessConfiguration: AWS = {
  service: "gunshots",
  frameworkVersion: "3",
  plugins: [
    "serverless-webpack",
    "serverless-iam-roles-per-function",
    "serverless-stack-output",
  ],
  custom: {
    output: {
      handler: "src/scripts/stackOutput.handler",
    },
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: {
        forceExclude: ["aws-sdk"],
      },
    },
    AWS_ACCOUNT_ID: "${env:AWS_ACCOUNT_ID}",
    S3_BUCKET_IMAGES:
      "${self:service}-${self:provider.stage}-${env:S3_BUCKET_IMAGES_SUFFIX}", // public facing
    SNS_UPLOAD_NAME: "${self:service}-${self:provider.stage}-upload",
    SNS_SEND_INCIDENTS_NAME:
      "${self:service}-${self:provider.stage}-send-incidents",
    SNS_SEND_INCIDENTS_ARN_PREFIX:
      "arn:aws:sns:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}",
    SSM_PATH_GOOGLE_KEY: "/gunshots/googleAPIKey",
  },
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    stage: "${opt:stage, 'dev'}",
    region: "${env:AWS_DEFAULT_REGION}" as any,
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      DB_NAME: "${self:service}-${self:provider.stage}",
      DB_NAME_GSK: "GSK-GSSK-index",
    },
    logRetentionInDays: 3,
    memorySize: 256,
    timeout: 120,
    versionFunctions: false,
    logs: {
      websocket: {
        level: "ERROR",
        fullExecutionData: false,
      },
    },
  },
  resources: {
    Resources: {
      S31: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:custom.S3_BUCKET_IMAGES}",
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
              AttributeName: "GSK",
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
              IndexName: "${self:provider.environment.DB_NAME_GSK}",
              Projection: {
                ProjectionType: "ALL",
              },
              ProvisionedThroughput: {
                ReadCapacityUnits: constants.DynamoDBReadCapacityUnits,
                WriteCapacityUnits: constants.DynamoDBWriteCapacityUnits,
              },
              KeySchema: [
                {
                  AttributeName: "GSK",
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
            "arn:aws:execute-api:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}:*/@connections/*",
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
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}",
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
      environment: {
        BUST_CACHE: `${Date.now()}`,
      },
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
            "arn:aws:execute-api:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}:*/@connections/*",
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
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}",
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
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}/index/${self:provider.environment.DB_NAME_GSK}",
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
        S3_BUCKET_IMAGES: "${self:custom.S3_BUCKET_IMAGES}",
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
            "arn:aws:sns::${self:custom.AWS_ACCOUNT_ID}:${self:custom.SNS_UPLOAD_NAME}",
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
            "arn:aws:dynamodb:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}:table/${self:provider.environment.DB_NAME}",
        },
        {
          Effect: "Allow",
          Action: ["s3:ListBucket"],
          Resource: "arn:aws:s3:::${self:custom.S3_BUCKET_IMAGES}",
        },
        {
          Effect: "Allow",
          Action: ["s3:PutObject", "s3:PutObjectAcl", "s3:DeleteObject"],
          Resource: "arn:aws:s3:::${self:custom.S3_BUCKET_IMAGES}/*",
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
            "arn:aws:ssm:${self:provider.region}:${self:custom.AWS_ACCOUNT_ID}:parameter${self:custom.SSM_PATH_GOOGLE_KEY}",
        },
      ],
    },
  },
};

module.exports = serverlessConfiguration;
