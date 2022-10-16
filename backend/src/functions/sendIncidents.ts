import type { SNSHandler } from "aws-lambda";

import * as dynamodb from "../libs/dynamodb";
import { middyfy } from "../libs/middy";
import * as sns from "../libs/sns";
import { getApiGatewayManagementClient } from "../libs/apiGateway";

const sendIncidents: SNSHandler = async (event) => {
  const incomingId = event.Records[0]?.Sns?.Message;
  const connectionIds = [];
  const { websocket } = await dynamodb.getSettings();

  if (!websocket) {
    throw new Error("missing websocket");
  }

  const incidents = await dynamodb.getAllIncidents();
  const message = JSON.stringify(incidents);

  if (incomingId === sns.SEND_TO_ALL_INDICATOR) {
    const ids = await dynamodb.getAllConnectionsIds();
    connectionIds.push(...ids);
  } else {
    connectionIds.push(incomingId);
  }

  console.log("incidents.length", incidents.length);
  console.log("sending to", connectionIds);

  const messageCalls = connectionIds.map(async (connectionId) => {
    try {
      const data = { ConnectionId: connectionId, Data: message };
      const client = getApiGatewayManagementClient(websocket);
      await client.postToConnection(data).promise();
    } catch (err) {
      console.error("🙅🏻‍♀️ sendMessageToConnections", err);
      await dynamodb.removeItemByPrimaryKey(connectionId);
    }
  });
  await Promise.all(messageCalls);
};

export default middyfy(sendIncidents);
