import { String } from "aws-sdk/clients/codebuild";
import * as AWS from "aws-sdk";
const sns = new AWS.SNS();

export const sendMessage = async (
  topicArn: string,
  message: String
): Promise<void> => {
  const params = {
    Message: message,
    TopicArn: topicArn,
  };

  await sns.publish(params).promise();

  console.log("SNS sendMessage", params);
};
