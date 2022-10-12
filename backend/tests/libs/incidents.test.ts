import * as libIncidents from "../../src/libs/incidents";
import { CSVData1, incomingIncident1 } from "../__fixtures__/incidentData";
import * as libS3 from "../../src/libs/s3";
import * as libGoogle from "../../src/libs/google";

jest.mock("../../src/libs/s3");
jest.mock("../../src/libs/google");

const mockLibS3UploadItem = jest.spyOn(libS3, "uploadItem");
const mockLibGoogleFetchImage = jest.spyOn(libGoogle, "fetchImage");

describe("libIncidents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {});

  describe("csvItemsToIncomingIncidents", () => {
    it("changes cvs items to incoming incidents", () => {
      const result = libIncidents.csvItemsToIncomingIncidents(CSVData1);

      expect(result).toHaveLength(7);

      // spot check
      expect(result[2]).toMatchInlineSnapshot(`
{
  "# Injured": "1",
  "# Killed": "0",
  "Address": "E 113th St and Benham Ave",
  "City Or County": "Cleveland",
  "Incident Date": "September 12, 2022",
  "Incident ID": "2412750",
  "Operations": "N/A",
  "State": "Ohio",
}
`);

      // spot check
      expect(result[4]).toMatchInlineSnapshot(`
{
  "# Injured": "2",
  "# Killed": "0",
  "Address": "7000 block of S Normal Ave",
  "City Or County": "Chicago",
  "Incident Date": "September 12, 2022",
  "Incident ID": "2412712",
  "Operations": "N/A",
  "State": "Illinois",
}
`);
    });
  });

  describe("createNewIncident", () => {
    it("saves to S3 if google fetch is 200 and returns correct item", async () => {
      mockLibGoogleFetchImage.mockResolvedValue({
        status: 200, // ✅
        buffer: () => "data",
      } as any);

      process.env.S3_NAME = "test-s3-name";
      const result = await libIncidents.createNewIncident(
        "setId",
        incomingIncident1,
        [],
        "googleAPIKey"
      );

      expect(mockLibGoogleFetchImage).toBeCalledTimes(1);
      expect(mockLibS3UploadItem).toBeCalledTimes(1);
      expect(result).toMatchInlineSnapshot(`
{
  "address": "address",
  "city": "Cleveland",
  "date": "September 12, 2022",
  "id": "setId:2412750",
  "image": "https://S3_NAME.s3.amazonaws.com/2412750.jpeg",
  "metrics": {
    "injured": 1,
    "killed": 1,
  },
  "state": "Ohio",
}
`);
    });

    it("does not saves to S3 if google fetch is 200", async () => {
      mockLibGoogleFetchImage.mockResolvedValue({
        status: 500, // 🛑
        buffer: () => "data",
      } as any);

      await libIncidents.createNewIncident(
        "setId",
        incomingIncident1,
        [],
        "googleAPIKey"
      );

      expect(mockLibGoogleFetchImage).toBeCalledTimes(1);
      expect(mockLibS3UploadItem).toBeCalledTimes(0);
    });
    it("does not fetch image nor save to S3 if previous s3 item found", async () => {
      await libIncidents.createNewIncident(
        "setId",
        incomingIncident1,
        ["2412750.jpeg"],
        "googleAPIKey"
      );

      expect(mockLibGoogleFetchImage).toBeCalledTimes(0);
      expect(mockLibS3UploadItem).toBeCalledTimes(0);
    });

    it("does not fetch image and save to S3 if address is N/A", async () => {
      const results = await libIncidents.createNewIncident(
        "setId",
        {
          ...incomingIncident1,
          Address: "N/A", // boom
        },
        [],
        "googleAPIKey"
      );

      expect(mockLibGoogleFetchImage).not.toHaveBeenCalled();
      expect(mockLibS3UploadItem).not.toHaveBeenCalled();

      expect(results).toMatchInlineSnapshot(`
{
  "address": "N/A",
  "city": "Cleveland",
  "date": "September 12, 2022",
  "id": "setId:2412750",
  "metrics": {
    "injured": 1,
    "killed": 1,
  },
  "state": "Ohio",
}
`);
    });
  });
});
