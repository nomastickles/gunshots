## INTRO

DEMO: [https://nomastickles.github.io/gunshots/](https://nomastickles.github.io/gunshots/)

The backend and frontend code of this project houses and visualizes data provided by [gunviolencearchive.org](https://www.gunviolencearchive.org).

This system is a teaching aid for a Udemy course that will also bring awareness to [gunviolencearchive.org](https://www.gunviolencearchive.org/about) initiatives.

|                 mobile example 1                  |                 mobile example 2                  |
| :-----------------------------------------------: | :-----------------------------------------------: |
| ![example-incident-1](img/example-incident-3.png) | ![example-incident-1](img/example-incident-4.png) |

|                  desktop example                  |
| :-----------------------------------------------: |
| ![example-incident-1](img/example-incident-1.png) |

## BACKEND

- Serverless Framework + Typescript + Tests
- AWS IAM, Lambda, API Gateway Websockets, DynamoDb, SNS, S3, SSM
- Google Street View Images API

## FRONTEND

- React + Redux Toolkit + Typescript + Tests
- Tailwind CSS Responsive Design, Animate.css

## DATA UPLOAD

![cloud-design-upload](img/cloud-design-upload.png)

## WEBSOCKET CONNECTIONS

![cloud-design-browsers](img/cloud-design-browsers.png)

## DYNAMODB STRUCTURE

DynamoDB holds three data structures: websocket connection ids, gunshot incident records, and various settings .

### INCIDENTS

```
// Primary Key "PK" is in the form of <currentSetId>:<item id>

{
  "PK": {
    "S": "sijzhh:1231232"
  },
  "DATA": {
    "S": "{"date":"September 13, 2021","state":"Illinois","city":"Chicago","address":"8700 block of S State","killed":0,"injured":1,"id":"sijzhh:1231232","image":"https://some-bucket.amazonaws.com/1231232.jpeg"}"
  },
  "GSPK": {
    "S": "incident"
  },
  "GSSK": {
    "N": "1659837126612"
  }
}
```

### APP SETTINGS

example currentSetId

```

{
  "PK": {
    "S": "currentSetId"
  },
  "DATA": {
    "S": "sijzhh"
  },
  "GSPK": {
    "S": "setting"
  },
  "GSSK": {
    "N": "1659837127120"
  }
}
```

example websocket

```
{
  "PK": {
    "S": "websocket"
  },
  "DATA": {
    "S": "wss://abc.execute-api.us-east-1.amazonaws.com/stage"
  },
  "GSPK": {
    "S": "setting"
  },
  "GSSK": {
    "N": "0"
  }
}

```

## STEPS TO RUN

### 1. ADD ./backend/config.js

```
module.exports.aws = {
  accountId: "xxx",
  region: "us-east-1",
  s3NamePrefix: "somePrefix"
};
```

### 2. BACKEND DEPLOY

```
cd backend && yarn && yarn deploy:dev
```

example output:

```
Stack Outputs:
  ServiceEndpointWebsocket: wss://NEW-WEBSOCKET.execute-api.us-east-1.amazonaws.com/stage
  ServerlessDeploymentBucketName: gunshots-stage-serverlessdeploymentbucket-1pld5fdsfvavo2a

```

### 3. DYNAMODB / CREATE WEBSOCKET SETTING

In AWS DynamoDB console, manually add websocket as a setting item

example:

```
{
  "PK": {
    "S": "websocket"
  },
  "DATA": {
    "S": "wss://NEW-WEBSOCKET.execute-api.us-east-1.amazonaws.com/dev"
  },
  "GSPK": {
    "S": "setting"
  },
  "GSSK": {
    "N": "0"
  }
}
```

### 4. SAVE GOOGLE STREETVIEW API

Add Google API key to AWS Systems Manager Parameter Store with path /gunshots/googleAPIKey

Please see [https://developers.google.com/maps/documentation/streetview/usage-and-billing](https://developers.google.com/maps/documentation/streetview/usage-and-billing) for details on Google API usage and costs.

### 5. UPLOAD 72 HOUR CSV

- get csv from [https://www.gunviolencearchive.org/last-72-hours](https://www.gunviolencearchive.org/last-72-hours)
- send csv data via sns through AWS console

![sns example](img/sns-example.png)

### 6. FRONTEND DEPLOY

```sh
cd frontend && yarn && yarn start
```

- add ServiceEndpointWebsocket to frontend input
