const AWS = require("aws-sdk");

async function updateApiGateway(region, websocket) {
  try {
    const stage = websocket.split("/").reverse()[0];
    const id = websocket.split("wss://")?.[1]?.split(".")?.[0];
    const ApiGatewayV2 = new AWS.ApiGatewayV2({ region });

    const routeSettings = {
      DataTraceEnabled: false,
      DetailedMetricsEnabled: false,
      LoggingLevel: "ERROR",
      ThrottlingBurstLimit: 5,
      ThrottlingRateLimit: 5,
    };

    await ApiGatewayV2.updateStage({
      ApiId: id,
      StageName: stage,
      DefaultRouteSettings: {
        ...routeSettings,
      },
      RouteSettings: {
        $connect: {
          ...routeSettings,
        },
        $disconnect: {
          ...routeSettings,
        },
      },
    }).promise();
  } catch (e) {
    console.error("❌ updateApiGateway", e);
    throw e;
  }
}

module.exports = updateApiGateway;
