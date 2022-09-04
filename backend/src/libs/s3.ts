import * as AWS from "aws-sdk";

const s3Client = new AWS.S3();
const Bucket = process.env.S3_NAME;
const GRANT_PUBLIC_READ = "uri=http://acs.amazonaws.com/groups/global/AllUsers";

/**
 **/
export const fetchAllItems = async (
  token?: string
): Promise<AWS.S3.Object[]> => {
  const { Contents, NextContinuationToken } = await s3Client
    .listObjectsV2({
      Bucket,
      ContinuationToken: token,
    })
    .promise();

  if (!NextContinuationToken) {
    return Contents;
  }

  const rest = await fetchAllItems(NextContinuationToken);
  return [...Contents, ...rest];
};

export const fetchAllItemKeys = async () => {
  const items = await fetchAllItems();
  return items.map((i) => i.Key);
};

export async function uploadItem(key: string, data: Buffer | string) {
  await s3Client
    .putObject({
      Bucket,
      Key: key,
      Body: data,
      GrantRead: GRANT_PUBLIC_READ,
      ContentType: "image/jpeg",
    })
    .promise();

  console.log("🔼 🗺 uploaded image:", key);
}

export async function deleteItems(keys: string[]) {
  await s3Client
    .deleteObjects({
      Bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    })
    .promise();
  console.log("💰 🗺 🦋 💨 deleteImages");
}
