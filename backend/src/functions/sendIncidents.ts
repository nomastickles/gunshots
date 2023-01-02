import type { SNSHandler } from "aws-lambda";

import * as dynamodb from "../libs/dynamodb";
import { middyfy } from "../libs/middy";
import * as sns from "../libs/sns";
import { getApiGatewayManagementClient } from "../libs/apiGateway";
import { Incident } from "src/types";

let cachedWebsocket: string = undefined;
let cachedAllIncidents: Incident[] = undefined;

const sendIncidents: SNSHandler = async (event) => {
  const incomingId = event.Records[0]?.Sns?.Message;
  const connectionIds = [];

  if (!cachedWebsocket) {
    const { websocket } = await dynamodb.getSettings();
    cachedWebsocket = websocket;
  }

  if (!cachedWebsocket) {
    throw new Error("missing websocket");
  }

  if (!cachedAllIncidents) {
    cachedAllIncidents = await dynamodb.getAllIncidents();
  }
  const message = JSON.stringify(cachedAllIncidents);

  if (incomingId === sns.SEND_TO_ALL_INDICATOR) {
    const ids = await dynamodb.getAllConnectionsIds();
    connectionIds.push(...ids);
  } else {
    connectionIds.push(incomingId);
  }

  console.log("ALL_INCIDENTS_CACHED.length", cachedAllIncidents.length);
  console.log("sending to", connectionIds);

  const messageCalls = connectionIds.map(async (connectionId) => {
    try {
      const data = { ConnectionId: connectionId, Data: message };
      const client = getApiGatewayManagementClient(cachedWebsocket);
      await client.postToConnection(data).promise();
    } catch (err) {
      console.error("🙅🏻‍♀️ sendMessageToConnections", err);
      await dynamodb.removeItemByPrimaryKey(connectionId);
    }
  });
  await Promise.all(messageCalls);
};

export default middyfy(sendIncidents);
