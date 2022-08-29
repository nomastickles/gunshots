import * as dynamodb from "@libs/dynamodb";
import { middyfy } from "@libs/middy";
import type { SNSHandler } from "aws-lambda";
import { ApiGatewayManagementApi } from "aws-sdk";
import * as constants from "@src/constants";

const sendIncidents: SNSHandler = async (event) => {
  try {
    const incomingId = event.Records[0]?.Sns?.Message;
    const connectionIds = [];
    const { currentSetId, websocket } = await dynamodb.getSettings();

    if (!currentSetId || !websocket) {
      console.error("missing currentSetId");
      return;
    }

    if (!websocket) {
      console.error("missing websocket!! ");
      return;
    }
    if (incomingId === constants.SEND_TO_ALL_INDICATOR) {
      const ids = await dynamodb.getAllConnectionsIds();
      connectionIds.push(...ids);
    } else {
      connectionIds.push(incomingId);
    }

    const client = new ApiGatewayManagementApi({
      endpoint: websocket.split("wss://").reverse()[0],
    });

    const incidents = await dynamodb.getAllIncidents();

    /**
     * only take the incidents that start with currentSetId
     */
    const message = JSON.stringify(
      incidents.filter((i) =>
        i.id.startsWith(`${currentSetId}${constants.DIVIDER}`)
      )
    );

    console.log("incidents.length", incidents.length);
    console.log("sending to", connectionIds);

    const messageCalls = connectionIds.map(async (connectionId) => {
      try {
        const data = { ConnectionId: connectionId, Data: message };
        await client.postToConnection(data).promise();
      } catch (err) {
        console.log("🙅🏻‍♀️ sendMessageToConnections", err);
        if (err?.statusCode === 410) {
          await dynamodb.removeItemByPrimaryKey(connectionId);
        }
      }
    });
    await Promise.all(messageCalls);
  } catch (e) {
    console.log("💥", e);
  }
};

export default middyfy(sendIncidents);
