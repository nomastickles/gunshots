import lambdaFunction from "../../src/functions/sendIncidents";

import * as libDynamodb from "../../src/libs/dynamodb";
import * as libAPIGateway from "../../src/libs/apiGateway";
import { context } from "../testUtils";

import event1 from "../__fixtures__/SNSSendIncidents1.json";
// import event2 from "../__fixtures__/SNSSendIncidents2.json";
import { incident1 } from "../__fixtures__/incidentData";

jest.mock("../../src/libs/dynamodb");
// const mockLibDynamodbGetAllConnectionsIds = jest.spyOn(
//   libDynamodb,
//   "getAllConnectionsIds"
// );
const mockLibDynamodbGetAllIncidents = jest.spyOn(
  libDynamodb,
  "getAllIncidents"
);
// const mockLibDynamodbRemoveItemByPrimaryKey = jest.spyOn(
//   libDynamodb,
//   "removeItemByPrimaryKey"
// );
const mockLibDynamodbGetSettings = jest.spyOn(libDynamodb, "getSettings");

jest.mock("../../src/libs/apiGateway");
const mockGetApiGatewayManagementClient = jest.spyOn(
  libAPIGateway,
  "getApiGatewayManagementClient"
);

const mockAPIGatewayPostToConnection = jest.fn().mockReturnValue({
  promise: jest.fn(),
});
mockGetApiGatewayManagementClient.mockReturnValue({
  postToConnection: mockAPIGatewayPostToConnection,
} as any);

describe("sendIncidents lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends to a single connection", async () => {
    mockLibDynamodbGetSettings.mockResolvedValue({
      currentSetId: "setId",
      websocket: "websocket",
    });

    mockLibDynamodbGetAllIncidents.mockResolvedValue([incident1]);

    await lambdaFunction(event1, context);

    expect(mockLibDynamodbGetAllIncidents).toHaveBeenCalled();
    expect(mockGetApiGatewayManagementClient).toHaveBeenCalledWith("websocket");
    expect(mockAPIGatewayPostToConnection.mock.calls[0]).toMatchInlineSnapshot(`
[
  {
    "ConnectionId": "CONNECTION_ID",
    "Data": "[{"address":"address","city":"Cleveland","date":"September 12, 2022","id":"setId:2412750","image":"https://S3_NAME.s3.amazonaws.com/2412750.jpeg","metrics":{"injured":1,"killed":1},"state":"Ohio"}]",
  },
]
`);
  });
});
