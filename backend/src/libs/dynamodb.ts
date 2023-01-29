import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
  GetItemCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";

import * as libGeneral from "./general";
import * as constants from "../constants";
import { DynamoDBItem, Incident } from "../types";

export const DynamoDBWriteTimeout = Math.round(
  (1 / constants.DynamoDBWriteCapacityUnits) * 1000
);
export const DynamoDBReadTimeout = Math.round(
  (1 / constants.DynamoDBReadCapacityUnits) * 1000
);

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TableName = process.env.DB_NAME;
const IndexName = process.env.DB_NAME_GSPK;

export const addDynamoDBConnection = async (connectionId: string) => {
  await libGeneral.timeout(DynamoDBWriteTimeout);
  const item = {
    PK: {
      S: connectionId,
    },
    GSPK: {
      S: "connection",
    },
    GSSK: {
      N: `${Date.now()}`,
    },
  };

  await dbClient.send(
    new PutItemCommand({
      TableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(PK)",
    })
  );
  console.log("🤝 addDynamoDBConnection");
};

export const addDynamoDBIncidents = async (incidents: Incident[]) => {
  await libGeneral.timeout(DynamoDBWriteTimeout);
  const item = {
    PK: {
      S: "incidents",
    },
    GSPK: {
      S: "data",
    },
    GSSK: {
      N: `${Date.now()}`,
    },
    DATA: {
      S: JSON.stringify(incidents),
    },
  };

  await dbClient.send(
    new PutItemCommand({
      TableName,
      Item: item,
    })
  );
  console.log("➕ # saved incidents:", incidents.length);
};

async function getDynamoDBItemByPK(
  pk: string
): Promise<Record<string, AttributeValue>> {
  await libGeneral.timeout(DynamoDBReadTimeout);
  const data = await dbClient.send(
    new GetItemCommand({
      TableName,
      Key: {
        PK: { S: pk },
      },
    })
  );

  console.log("⚡️ getDynamoDBItemByPK", { pk });
  const results = data?.Item || undefined;
  return results;
}

/**
 * used to get all connections
 */
async function getDynamoDBItemsByGSPK(
  itemName: string,
  exclusiveStartKey?: any
): Promise<DynamoDBItem[]> {
  await libGeneral.timeout(DynamoDBReadTimeout);

  const { Items, LastEvaluatedKey } = await dbClient.send(
    new QueryCommand({
      TableName,
      IndexName,
      ExclusiveStartKey: exclusiveStartKey,
      KeyConditionExpression: "GSPK = :gspk",
      ExpressionAttributeValues: {
        ":gspk": { S: itemName },
      },
    })
  );

  const results = Items as DynamoDBItem[];

  console.log("⚡️ getDynamoDBItemsByGSPK", { itemName, exclusiveStartKey });

  if (!LastEvaluatedKey) {
    return results;
  }

  const rest = await getDynamoDBItemsByGSPK(itemName, LastEvaluatedKey);
  return [...results, ...rest];
}

export const removeDynamoDBItemByPK = async (id: string) => {
  await libGeneral.timeout(DynamoDBWriteTimeout);
  await dbClient.send(
    new DeleteItemCommand({
      TableName,
      Key: {
        PK: {
          S: id,
        },
      },
    })
  );
  console.log("🔥🤲 removeDynamoDBItemByPK", id);
};

export const getAllDynamoDBConnectionsIds = async () => {
  const items = await getDynamoDBItemsByGSPK("connection");
  return items.map((i) => i.PK.S);
};

export const getAllDynamoDBIncidents = async () => {
  const dbItem = await getDynamoDBItemByPK("incidents");
  const dataRaw = dbItem?.DATA?.S;
  try {
    const allIncidents = JSON.parse(dataRaw);
    return allIncidents;
  } catch (_e) {
    return [];
  }
};

export const getAllDynamoDBSettings = async () => {
  const item = await getDynamoDBItemByPK("websocket");

  return {
    websocket: item?.DATA?.S,
  };
};
