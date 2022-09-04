import { formatJSONResponse } from "@libs/apiGateway";
import * as dynamodb from "@libs/dynamodb";
import { middyfy } from "@libs/middy";
import * as sns from "@libs/sns";
import type { APIGatewayRequestAuthorizerEvent, Handler } from "aws-lambda";

const connectionManager: Handler<APIGatewayRequestAuthorizerEvent> = async (
  event
) => {
  const id = event.requestContext.connectionId;

  if (event.requestContext.eventType === "CONNECT") {
    await dynamodb.addConnection(id);

    await sns.sendMessage(process.env.SNS_TOPIC_SEND_INCIDENTS, id);
  } else if (event.requestContext.eventType === "DISCONNECT") {
    await dynamodb.removeItemByPrimaryKey(id);
  }
  return formatJSONResponse({
    message: "🟢",
  });
};

export default middyfy(connectionManager);
