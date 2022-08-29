## INTRO

The backend and frontend code of this project constitutes a data visualization system that runs on data provided by [gunviolencearchive.org](www.gunviolencearchive.org).

This system is a teaching aid for a Udemy course that will also bring awareness to [gunviolencearchive.org](https://www.gunviolencearchive.org) initiatives.

|                 mobile example 1                  |                 mobile example 2                  |
| :-----------------------------------------------: | :-----------------------------------------------: |
| ![example-incident-1](img/example-incident-3.png) | ![example-incident-1](img/example-incident-4.png) |

|                  desktop example                  |
| :-----------------------------------------------: |
| ![example-incident-1](img/example-incident-1.png) |

### TECHNOLOGIES / LIBRARIES

- Serverless Framework + Typescript
- AWS IAM, Lambda, API Gateway Websockets, DynamoDb, SNS, S3, SSM
- Google Street View Images API
- React + Typescript, Redux Toolkit, Tailwind CSS Responsive, Animate.css

## DATA FLOW / 72 HOUR CSV UPLOAD

![cloud-design-upload](img/cloud-design-upload.png)

## DATA FLOW / BROWSER CONNECTIONS

![cloud-design-browsers](img/cloud-design-browsers.png)

## DYNAMODB STRUCTURE / INCIDENTS

```
// Primary Key "PK" is in the form of <currentSetId>:<hash of db item>

{
  "PK": {
    "S": "sijzhh:4dd586e6424f29e30523efc4409584f3"
  },
  "DATA": {
    "S": "{"date":"September 13, 2021","state":"Illinois","city":"Chicago","address":"8700 block of S State","killed":0,"injured":1,"id":"sijzhh:4dd586e6424f29e30523efc4409584f3","image":"https://some-bucket.amazonaws.com/4dd586e6424f29e30523efc4409584f3.jpeg"}"
  },
  "GSPK": {
    "S": "incident"
  },
  "GSSK": {
    "N": "1659837126612"
  }
}
```

## DYNAMODB STRUCTURE / APP SETTINGS

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

## 1. ADD ./backend/config.js

```
module.exports.aws = {
  accountId: "xxx",
  region: "us-east-1",
  s3NamePrefix: "somePrefix"
};
```

## 2. BACKEND DEPLOY

```
cd backend && yarn && yarn deploy:dev
```

example output:

```
Stack Outputs:
  ServiceEndpointWebsocket: wss://NEW-WEBSOCKET.execute-api.us-east-1.amazonaws.com/stage
  ServerlessDeploymentBucketName: gunshots-stage-serverlessdeploymentbucket-1pld5fdsfvavo2a

```

## 3. DYNAMODB / CREATE WEBSOCKET SETTING

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

## 4. UPLOAD 72 HOUR CSV

- get csv from [https://www.gunviolencearchive.org/last-72-hours](https://www.gunviolencearchive.org/last-72-hours)
- send csv data via sns through AWS console

![sns example](img/sns-example.png)

## 5. FRONTEND DEPLOY

```sh
cd frontend && yarn && yarn start
```

- add ServiceEndpointWebsocket to frontend input
