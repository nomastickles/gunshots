const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");
const dynamoDB = require("@aws-sdk/client-dynamodb");

/**
 * STAGE=dev1 yarn scripts:upload
 */
(async () => {
  console.log("💥 uploadCSVwithSNS");
  const dir = `${__dirname}/../csv`;
  const { file } = getMostRecentFile(dir);
  const region = process.env.AWS_DEFAULT_REGION;
  const accountId = process.env.AWS_ACCOUNT_ID;
  const stage = process.env.STAGE;
  const dbName = `gunshots-${stage}`;

  if (!file) {
    console.error("missing csv");
    return;
  }

  if (!stage) {
    console.error("missing stage");
    return;
  }

  const data = fs.readFileSync(`${dir}/${file}`, "utf8");
  const topicArn = `arn:aws:sns:${region}:${accountId}:gunshots-upload-${stage}`;

  const dbClient = new dynamoDB.DynamoDBClient({
    region,
  });

  const result = await dbClient.send(
    new dynamoDB.GetItemCommand({
      TableName: dbName,
      Key: {
        PK: { S: "lastFileName" },
      },
    })
  );

  if (result?.Item?.DATA.S === file) {
    console.warn("🛑 data already sent");
    return;
  }

  const sns = new AWS.SNS({
    region,
  });

  await sns
    .publish({
      Message: data,
      TopicArn: topicArn,
    })
    .promise();

  await dbClient.send(
    new dynamoDB.PutItemCommand({
      TableName: dbName,
      Item: {
        PK: {
          S: "lastFileName",
        },
        GSPK: {
          S: "setting",
        },
        GSSK: {
          N: `${Date.now()}`,
        },
        DATA: {
          S: file,
        },
      },
    })
  );

  console.log("data sent and last file name updated");
})();

function getMostRecentFile(dir) {
  const files = orderFiles(dir);
  return files.length ? files[0] : undefined;
}

function orderFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((fileName) => {
      const file = path.join(dir, fileName);
      return fs.lstatSync(file).isFile() && fileName.endsWith(".csv");
    })
    .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}
