const updateWebsocket = require("./updateWebsocket");

function handler(data, _serverless, options) {
  // console.log("💥 Stack Output", options);
  const { ServiceEndpointWebsocket } = data;

  if (ServiceEndpointWebsocket) {
    updateWebsocket(options.region, ServiceEndpointWebsocket).then(() => {
      console.log("🤝 websocket updated");
    });
  }
}

module.exports = { handler };
