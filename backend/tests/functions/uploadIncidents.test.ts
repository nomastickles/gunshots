import lambdaFunction from "../../src/functions/uploadIncidents";

import * as libDynamodb from "../../src/libs/dynamodb";
import * as libSSM from "../../src/libs/ssm";
import * as libSNS from "../../src/libs/sns";
import * as libS3 from "../../src/libs/s3";
import * as libGoogle from "../../src/libs/google";

import { SNSMessageUploadData as event } from "../__fixtures__/incidentData";

import { context } from "../testUtils";

jest.mock("../../src/libs/dynamodb");
const mockLibDynamodbAddIncidents = jest.spyOn(libDynamodb, "addAllIncidents");

const mockLibDynamodbGetAllIncidents = jest.spyOn(
  libDynamodb,
  "getAllIncidents"
);
const mockLibDynamodbRemoveItemByPrimaryKey = jest.spyOn(
  libDynamodb,
  "removeItemByPrimaryKey"
);

jest.mock("../../src/libs/sns");
const mockLibSNSSendMessage = jest.spyOn(libSNS, "sendMessage");

jest.mock("../../src/libs/s3");
const mockLibS3FetchAllItemKeys = jest.spyOn(libS3, "fetchAllItemKeys");

const mockLibS3DeleteItems = jest.spyOn(libS3, "deleteItems");

jest.mock("../../src/libs/ssm");
const mockLibSSMGetParameter = jest.spyOn(libSSM, "getParameter");

jest.mock("../../src/libs/google");
const mockLibGoogleFetchImage = jest.spyOn(libGoogle, "fetchImage");

describe("uploadIncidents lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLibSSMGetParameter.mockResolvedValue("googleAPIKey");
    mockLibDynamodbGetAllIncidents.mockResolvedValue([]);
    mockLibS3FetchAllItemKeys.mockResolvedValue([]);
    mockLibS3DeleteItems.mockResolvedValue();

    mockLibGoogleFetchImage.mockResolvedValue({
      status: 200, // ✅
      buffer: () => "data",
    } as any);
  });

  it("saves uploaded cvs data", async () => {
    await lambdaFunction(event, context);

    expect(mockLibSSMGetParameter).toHaveBeenCalledTimes(1);
    expect(mockLibS3FetchAllItemKeys).toHaveBeenCalledTimes(1);
    /**
     * here 6 not 7 since there's one "NA" address incident
     */
    expect(mockLibGoogleFetchImage).toHaveBeenCalledTimes(6);
    expect(mockLibDynamodbGetAllIncidents).toHaveBeenCalledTimes(1);
    expect(mockLibDynamodbAddIncidents).toHaveBeenCalledTimes(1);
    expect(mockLibSNSSendMessage).toHaveBeenCalledTimes(1);

    expect(mockLibDynamodbRemoveItemByPrimaryKey).not.toHaveBeenCalled();
    expect(mockLibS3DeleteItems).not.toHaveBeenCalled();
  });
});
