import lambdaFunction from "../../src/functions/connectionManager";

import * as libDynamodb from "../../src/libs/dynamodb";
import * as libSNS from "../../src/libs/sns";
import { context } from "../testUtils";

import event1 from "../__fixtures__/APIGatewayEvent1.json";
import event2 from "../__fixtures__/APIGatewayEvent2.json";

jest.mock("../../src/libs/dynamodb");
const mockLibDynamodbAddConnection = jest.spyOn(
  libDynamodb,
  "addDynamoDBConnection"
);
const mockLibDynamodbRemoveItemByPrimaryKey = jest.spyOn(
  libDynamodb,
  "removeDynamoDBItemByPK"
);

jest.mock("../../src/libs/sns");
const mockLibSNSSendMessage = jest.spyOn(libSNS, "sendSNSMessage");

describe("connectionManager lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds new connection id and initiates send data SNS with connect event", async () => {
    const result = await lambdaFunction(event1, context);

    expect(mockLibDynamodbRemoveItemByPrimaryKey).not.toHaveBeenCalled();

    expect(mockLibDynamodbAddConnection.mock.calls[0]).toMatchInlineSnapshot(`
[
  "CONNECTION_ID",
]
`);
    expect(mockLibSNSSendMessage.mock.calls[0]).toMatchInlineSnapshot(`
[
  "SNS_TOPIC_SEND_INCIDENTS",
  "CONNECTION_ID",
]
`);

    expect(result).toMatchInlineSnapshot(`
{
  "body": "{"message":"🟢"}",
  "statusCode": 200,
}
`);
  });

  it("removes connection id with disconnect event", async () => {
    const result = await lambdaFunction(event2, context);

    expect(mockLibDynamodbRemoveItemByPrimaryKey.mock.calls[0])
      .toMatchInlineSnapshot(`
[
  "CONNECTION_ID",
]
`);

    expect(mockLibDynamodbAddConnection).not.toHaveBeenCalled();
    expect(mockLibSNSSendMessage).not.toHaveBeenCalled();

    expect(result).toMatchInlineSnapshot(`
{
  "body": "{"message":"🟢"}",
  "statusCode": 200,
}
`);
  });
});
