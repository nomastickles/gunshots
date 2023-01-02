const fs = require("fs");
const path = require("path");
const AWS = require("aws-sdk");

/**
 * STAGE=dev1 yarn scripts:upload
 */
(async () => {
  console.log("💥 uploadCSVwithSNS");
  const dir = `${__dirname}/../csv`;
  const { file } = getMostRecentFile(dir);
  const region = process.env.AWS_DEFAULT_REGION;
  const accountId = process.env.ACCOUNT_ID;
  const stage = process.env.STAGE || "dev";

  if (!file) {
    console.error("missing csv");
    return;
  }

  if (!stage) {
    console.error("missing stage");
    return;
  }

  console.log("file", file);

  const data = fs.readFileSync(`${dir}/${file}`, "utf8");
  const topicArn = `arn:aws:sns:${region}:${accountId}:gunshots-upload-${stage}`;

  const sns = new AWS.SNS({
    region,
  });

  const params = {
    Message: data,
    TopicArn: topicArn,
  };

  await sns.publish(params).promise();

  console.log("data sent");
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
