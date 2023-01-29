import lambdaFunction from "../../src/functions/sendIncidents";

import * as libDynamodb from "../../src/libs/dynamodb";
import * as libAPIGateway from "../../src/libs/apiGateway";
import { context } from "../testUtils";

import event1 from "../__fixtures__/SNSSendIncidents1.json";
import event2 from "../__fixtures__/SNSSendIncidents2.json";
import { incident1 } from "../__fixtures__/incidentData";

// this is the best thing

jest.mock("../../src/libs/dynamodb");
const mockLibDynamodbGetAllConnectionsIds = jest.spyOn(
  libDynamodb,
  "getAllDynamoDBConnectionsIds"
);
const mockLibDynamodbGetAllIncidents = jest.spyOn(
  libDynamodb,
  "getAllDynamoDBIncidents"
);

const mockLibDynamodbGetSettings = jest.spyOn(
  libDynamodb,
  "getAllDynamoDBSettings"
);

jest.mock("../../src/libs/apiGateway");
let mockGetApiGatewayManagementClient = jest.spyOn(
  libAPIGateway,
  "getApiGatewayManagementClient"
);
const mockAPIGatewayPostToConnection = jest.fn();

// a new things 🎬 and something else!!

describe("sendIncidents lambda", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockAPIGatewayPostToConnection.mockReturnValue({
      promise: jest.fn(),
    });

    mockGetApiGatewayManagementClient.mockReturnValue({
      postToConnection: mockAPIGatewayPostToConnection,
    } as any);
  });

  it("sends to a single client connection", async () => {
    mockLibDynamodbGetSettings.mockResolvedValue({
      websocket: "websocket",
    });

    mockLibDynamodbGetAllIncidents.mockResolvedValue([incident1]);

    await lambdaFunction(event1, context);

    expect(mockLibDynamodbGetAllConnectionsIds).not.toHaveBeenCalled();
    expect(mockLibDynamodbGetAllIncidents).toHaveBeenCalled();
    expect(mockGetApiGatewayManagementClient).toHaveBeenCalledWith("websocket");
    expect(mockAPIGatewayPostToConnection).toHaveBeenCalledTimes(1);
    expect(mockAPIGatewayPostToConnection.mock.calls[0]).toMatchInlineSnapshot(`
[
  {
    "ConnectionId": "CONNECTION_ID",
    "Data": "[{"address":"address","city":"Cleveland","date":"September 12, 2022","id":"2412750","image":"https://S3_BUCKET_IMAGES.s3.amazonaws.com/2412750.jpeg","metrics":{"injured":1,"killed":1},"state":"Ohio"}]",
  },
]
`);
  });

  it("sends to a all client connections", async () => {
    mockLibDynamodbGetSettings.mockResolvedValue({
      websocket: "websocket",
    });

    mockLibDynamodbGetAllIncidents.mockResolvedValue([incident1]);
    mockLibDynamodbGetAllConnectionsIds.mockResolvedValue(["id1", "id2"]);

    await lambdaFunction(event2, context);

    expect(mockLibDynamodbGetAllConnectionsIds).toHaveBeenCalled();
    expect(mockLibDynamodbGetAllIncidents).not.toHaveBeenCalled(); // cached
    expect(mockGetApiGatewayManagementClient).toHaveBeenCalledWith("websocket");
    expect(mockAPIGatewayPostToConnection).toHaveBeenCalledTimes(2);
  });
});
