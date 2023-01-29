import type { APIGatewayRequestAuthorizerEvent, Handler } from "aws-lambda";

import { formatJSONResponse } from "../libs/apiGateway";
import * as dynamodb from "../libs/dynamodb";
import { middyfy } from "../libs/middy";
import * as sns from "../libs/sns";

const connectionManager: Handler<APIGatewayRequestAuthorizerEvent> = async (
  event
) => {
  const id = event.requestContext.connectionId;
  try {
    if (event.requestContext.eventType === "CONNECT") {
      await dynamodb.addDynamoDBConnection(id);
      await sns.sendSNSMessage(process.env.SNS_TOPIC_SEND_INCIDENTS, id);
    } else if (event.requestContext.eventType === "DISCONNECT") {
      await dynamodb.removeDynamoDBItemByPK(id);
    }
  } catch (err) {
    console.error(err, id);
    // fake boom
    throw Error("-");
  }

  return formatJSONResponse({
    message: "🟢",
  });
};

export default middyfy(connectionManager);
