const AWS = require("aws-sdk");

async function updateApiGateway(region, websocket) {
  try {
    const stage = websocket.split("/").reverse()[0];
    const id = websocket.split("wss://")?.[1]?.split(".")?.[0];
    const ApiGatewayV2 = new AWS.ApiGatewayV2({ region });

    const temp = await ApiGatewayV2.getStage({
      ApiId: id,
      StageName: stage,
    }).promise();

    console.log("🌈", temp.RouteSettings);

    await ApiGatewayV2.updateStage({
      ApiId: id,
      StageName: stage,
      DefaultRouteSettings: {
        DataTraceEnabled: false,
        DetailedMetricsEnabled: false,
        LoggingLevel: "ERROR",
        ThrottlingBurstLimit: 8,
        ThrottlingRateLimit: 8,
      },
      // RouteSettings: {
      //   boom: {
      //     DataTraceEnabled: false,
      //     DetailedMetricsEnabled: false,
      //     LoggingLevel: "ERROR",
      //     ThrottlingBurstLimit: 8,
      //     ThrottlingRateLimit: 8,
      //   },
      // },
    }).promise();
  } catch (e) {
    console.error("❌ updateApiGateway", e);
    throw e;
  }
}

module.exports = updateApiGateway;
