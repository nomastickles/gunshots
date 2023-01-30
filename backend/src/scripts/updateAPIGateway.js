const AWS = require("aws-sdk");

async function updateApiGateway(region, websocket) {
  try {
    const stage = websocket.split("/").reverse()[0];
    const id = websocket.split("wss://")?.[1]?.split(".")?.[0];
    const ApiGatewayV2 = new AWS.ApiGatewayV2({ region });

    await ApiGatewayV2.updateStage({
      ApiId: id,
      StageName: stage,
      RouteSettings: {
        $connect: {
          DataTraceEnabled: false,
          DetailedMetricsEnabled: false,
          LoggingLevel: "ERROR",
          ThrottlingBurstLimit: 5,
          ThrottlingRateLimit: 5,
        },
        $disconnect: {
          DataTraceEnabled: false,
          DetailedMetricsEnabled: false,
          LoggingLevel: "ERROR",
          ThrottlingBurstLimit: 5,
          ThrottlingRateLimit: 5,
        },
      },
    }).promise();
  } catch (e) {
    console.error("❌ updateApiGateway", e);
    throw e;
  }
}

module.exports = updateApiGateway;
