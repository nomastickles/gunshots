import * as dynamodb from "@libs/dynamodb";
import { middyfy } from "@libs/middy";
import type { SNSHandler } from "aws-lambda";

import * as sns from "@libs/sns";
import * as libIncidents from "@libs/incidents";
import { getApiGatewayManagementClient } from "@libs/apiGateway";

const sendIncidents: SNSHandler = async (event) => {
  const incomingId = event.Records[0]?.Sns?.Message;
  const connectionIds = [];
  const { currentSetId, websocket } = await dynamodb.getSettings();

  if (!currentSetId || !websocket) {
    throw new Error("missing data");
  }

  if (incomingId === sns.SEND_TO_ALL_INDICATOR) {
    const ids = await dynamodb.getAllConnectionsIds();
    connectionIds.push(...ids);
  } else {
    connectionIds.push(incomingId);
  }

  const incidents = await dynamodb.getAllIncidents();

  /**
   * only take the incidents that start with currentSetId
   */
  const message = JSON.stringify(
    incidents.filter((i) =>
      i.id.startsWith(`${currentSetId}${libIncidents.SET_ID_DIVIDER}`)
    )
  );

  console.log("incidents.length", incidents.length);
  console.log("sending to", connectionIds);

  const messageCalls = connectionIds.map(async (connectionId) => {
    try {
      const data = { ConnectionId: connectionId, Data: message };
      const client = getApiGatewayManagementClient(websocket);
      await client.postToConnection(data).promise();
    } catch (err) {
      console.error("🙅🏻‍♀️ sendMessageToConnections", err);
      if (err?.statusCode === 410) {
        await dynamodb.removeItemByPrimaryKey(connectionId);
      }
    }
  });
  await Promise.all(messageCalls);
};

export default middyfy(sendIncidents);
