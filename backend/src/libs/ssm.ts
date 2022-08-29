import * as AWS from "aws-sdk";

const ssm = new AWS.SSM();

export const getParameter = async (paramName: string): Promise<string> => {
  const responseWebsocketSSM = await ssm
    .getParameter({
      Name: paramName,
      WithDecryption: true,
    })
    .promise();
  return responseWebsocketSSM?.Parameter.Value || "";
};
