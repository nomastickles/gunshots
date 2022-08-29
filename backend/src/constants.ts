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
