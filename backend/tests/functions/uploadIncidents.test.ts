import lambdaFunction from "../../src/functions/uploadIncidents";

import * as libDynamodb from "../../src/libs/dynamodb";
import * as libSSM from "../../src/libs/ssm";
import * as libSNS from "../../src/libs/sns";
import * as libS3 from "../../src/libs/s3";
import * as libGoogle from "../../src/libs/google";

import { SNSMessageUploadData as event } from "../__fixtures__/incidentData";

import { context } from "../testUtils";

jest.mock("../../src/libs/dynamodb");
const mockLibDynamodbAddIncidents = jest.spyOn(
  libDynamodb,
  "addDynamoDBIncidents"
);

const mockLibDynamodbGetAllIncidents = jest.spyOn(
  libDynamodb,
  "getAllDynamoDBIncidents"
);
const mockLibDynamodbRemoveItemByPrimaryKey = jest.spyOn(
  libDynamodb,
  "removeDynamoDBItemByPK"
);

jest.mock("../../src/libs/sns");
const mockLibSNSSendMessage = jest.spyOn(libSNS, "sendSNSMessage");

jest.mock("../../src/libs/s3");
const listAllS3Objects = jest.spyOn(libS3, "listAllS3Objects");

const mockLibS3deleteS3Objects = jest.spyOn(libS3, "deleteS3Objects");

jest.mock("../../src/libs/ssm");
const mockLibSSMGetParameter = jest.spyOn(libSSM, "getSSMParameter");

jest.mock("../../src/libs/google");
const mockLibGoogleFetchImage = jest.spyOn(
  libGoogle,
  "fetchImageFromGoogleStreetView"
);

describe("uploadIncidents lambda", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLibSSMGetParameter.mockResolvedValue("googleAPIKey");
    mockLibDynamodbGetAllIncidents.mockResolvedValue([]);
    listAllS3Objects.mockResolvedValue([]);
    mockLibS3deleteS3Objects.mockResolvedValue();

    mockLibGoogleFetchImage.mockResolvedValue({
      status: 200, // ✅
      buffer: () => "data",
    } as any);
  });

  it("saves uploaded cvs data", async () => {
    await lambdaFunction(event, context);

    expect(mockLibSSMGetParameter).toHaveBeenCalledTimes(1);
    expect(listAllS3Objects).toHaveBeenCalledTimes(1);
    /**
     * here 6 not 7 since there's one "NA" address incident
     */
    expect(mockLibGoogleFetchImage).toHaveBeenCalledTimes(6);
    expect(mockLibDynamodbGetAllIncidents).toHaveBeenCalledTimes(1);
    expect(mockLibDynamodbAddIncidents).toHaveBeenCalledTimes(1);
    expect(mockLibSNSSendMessage).toHaveBeenCalledTimes(1);

    expect(mockLibDynamodbRemoveItemByPrimaryKey).not.toHaveBeenCalled();
    expect(mockLibS3deleteS3Objects).not.toHaveBeenCalled();
  });
});
