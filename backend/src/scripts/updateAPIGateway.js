const AWS = require("aws-sdk");

async function updateApiGateway(region, websocket) {
  try {
    const stage = websocket.split("/").reverse()[0];
    const id = websocket.split("wss://")?.[1]?.split(".")?.[0];
    const ApiGatewayV2 = new AWS.ApiGatewayV2({ region });
    console.log("updateApiGateway", id, stage);
    const params = {
      ApiId: id,
      StageName: stage,
      DefaultRouteSettings: {
        DataTraceEnabled: false,
        DetailedMetricsEnabled: false,
        LoggingLevel: "ERROR",
        ThrottlingBurstLimit: 8,
        ThrottlingRateLimit: 8,
      },
    };

    await ApiGatewayV2.updateStage(params).promise();
  } catch (e) {
    console.error("❌ updateApiGateway", e);
  }
}

module.exports = updateApiGateway;
