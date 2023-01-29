const updateDynamoDB = require("./updateDynamoDB");
const updateAPIGateway = require("./updateAPIGateway");

function handler(data, _serverless, options) {
  // console.log("💥 data", JSON.stringify(data));
  // console.log("💥 _serverless", _serverless);

  const { ServiceEndpointWebsocket } = data;

  Promise.all([
    updateDynamoDB(options.region, ServiceEndpointWebsocket),
    updateAPIGateway(options.region, ServiceEndpointWebsocket),
  ]).then(() => {
    console.log("🤝 stackOutput");
  });
}

module.exports = { handler };
