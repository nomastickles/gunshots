const dynamoDB = require("@aws-sdk/client-dynamodb");

async function updateWebsocket(region, websocket) {
  console.log("💥 updateWebsocket");
  const dbNameSuffix = websocket.split("/").reverse()[0];
  const dbName = `gunshots-${dbNameSuffix}`;

  const dbClient = new dynamoDB.DynamoDBClient({
    region,
  });

  const item = {
    PK: {
      S: "websocket",
    },
    GSPK: {
      S: "setting",
    },
    GSSK: {
      N: `${Date.now()}`,
    },
    DATA: {
      S: websocket,
    },
  };

  await dbClient.send(
    new dynamoDB.PutItemCommand({
      TableName: dbName,
      Item: item,
    })
  );
}

module.exports = updateWebsocket;
