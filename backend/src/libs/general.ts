import { Incident } from "@src/types";

export const DynamoDBWriteCapacityUnits = 2;
export const DynamoDBReadCapacityUnits = 1;

export const DynamoDBWriteTimeout = Math.round(
  (1 / DynamoDBWriteCapacityUnits) * 1000
);
export const DynamoDBReadTimeout = Math.round(
  (1 / DynamoDBReadCapacityUnits) * 1000
);

/**
 * https://developers.google.com/maps/documentation/streetview/usage-and-billing
 */
export const GoogleBatchLimitPerSecond = 500;

export const S3BaseURL = `https://${process.env.S3_NAME}.s3.amazonaws.com/`;

export const DIVIDER = ":";

export const SEND_TO_ALL_INDICATOR = "*";

export const chunkArray = (arr: any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_v, i) =>
    arr.slice(i * size, i * size + size)
  );

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getNewRandomWord = () =>
  (Math.random() + 1).toString(36).substring(7);

export const getAllIncidentsHashesStringFromIncidents = (items: Incident[]) =>
  items
    .map((i) => i.id.split(DIVIDER)[1])
    .sort()
    .join("");
