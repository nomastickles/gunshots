import { ApiGatewayManagementApi } from "aws-sdk";

export const formatJSONResponse = (response: Record<string, unknown>) => {
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};

export const getApiGatewayManagementClient = (websocket: string) => {
  const client = new ApiGatewayManagementApi({
    endpoint: websocket.split("wss://").reverse()[0],
  });

  return client;
};
