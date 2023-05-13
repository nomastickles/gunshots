const updateDynamoDB = require("./updateDynamoDB");
const updateAPIGateway = require("./updateAPIGateway");

function handler(data, _serverless, options) {
  const { ServiceEndpointWebsocket } = data;

  Promise.all([
    updateDynamoDB(options.region, ServiceEndpointWebsocket),
    updateAPIGateway(options.region, ServiceEndpointWebsocket),
  ]).then(() => {
    console.log("🤝 stackOutput");
  });
}

module.exports = { handler };
