const dynamoDB = require("@aws-sdk/client-dynamodb");

async function updateDynamoDB(region, websocket) {
  try {
    const stage = websocket.split("/").reverse()[0];
    const dbName = `gunshots-${stage}`;
    const dbClient = new dynamoDB.DynamoDBClient({
      region,
    });

    const item = {
      PK: {
        S: "websocket",
      },
      GSK: {
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
  } catch (e) {
    console.error("❌ updateWebsocket", e);
  }
}

module.exports = updateDynamoDB;
