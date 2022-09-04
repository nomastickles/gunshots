import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import * as libGeneral from "@libs/general";
import { DynamoDBItem, Incident } from "@src/types";

export const DynamoDBWriteCapacityUnits = 2;
export const DynamoDBReadCapacityUnits = 1;

export const DynamoDBWriteTimeout = Math.round(
  (1 / DynamoDBWriteCapacityUnits) * 1000
);
export const DynamoDBReadTimeout = Math.round(
  (1 / DynamoDBReadCapacityUnits) * 1000
);

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TableName = process.env.DB_NAME;
const IndexName = process.env.DB_NAME_GSPK;

export const addConnection = async (id: string) => {
  const item: DynamoDBItem = {
    PK: {
      S: id,
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
  console.log("🤝 addConnection");
};

async function getAllItemsByGSPK(
  name: string,
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
        ":gspk": { S: name },
      },
    })
  );

  const results = Items as DynamoDBItem[];

  console.log("⚡️ getAllItemsByGSPK", { name, exclusiveStartKey });

  if (!LastEvaluatedKey) {
    return results;
  }

  const rest = await getAllItemsByGSPK(name, LastEvaluatedKey);
  return [...results, ...rest];
}

export const getAllConnectionsIds = async () => {
  const items = await getAllItemsByGSPK("connection");
  return items.map((i) => i.PK.S);
};

export const getAllIncidents = async () => {
  const items = await getAllItemsByGSPK("incident");
  return items.map((i) => JSON.parse(i.DATA.S) as Incident);
};

/**
 * here we are using the image as a key since the name is already hashed
 * and we can add 'data' as the data store
 */
export const addIncident = async (incident: Incident) => {
  await libGeneral.timeout(DynamoDBWriteTimeout);
  const item: DynamoDBItem = {
    PK: {
      S: incident.id,
    },
    GSPK: {
      S: "incident",
    },
    GSSK: {
      N: `${Date.now()}`,
    },
    DATA: {
      S: JSON.stringify(incident),
    },
  };

  await dbClient.send(
    new PutItemCommand({
      TableName,
      Item: item,
      // ConditionExpression: "attribute_not_exists(PK)", // leaving this out to overwrite
    })
  );
  console.log("➕🤟 created Incident", item.id);
};

export const removeItemByPrimaryKey = async (id: string) => {
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
  console.log("🔥🤲 removeItemByPrimaryKey", id);
};

export const getSettings = async () => {
  const items = await getAllItemsByGSPK("setting");
  console.log("🤙 getSettings", items);

  let currentSetId: string = undefined;
  let websocket: string = undefined;

  items?.forEach((item) => {
    switch (item.PK.S) {
      case "currentSetId":
        currentSetId = item.DATA?.S;
        break;
      case "websocket":
        websocket = item.DATA?.S;
        break;
      default:
    }
  });

  return {
    currentSetId,
    websocket,
  };
};

export const updateCurrentSetId = async (setId: string) => {
  await libGeneral.timeout(DynamoDBWriteTimeout);
  const item: DynamoDBItem = {
    PK: {
      S: "currentSetId",
    },
    GSPK: {
      S: "setting",
    },
    GSSK: {
      N: `${Date.now()}`,
    },
    DATA: {
      S: setId,
    },
  };

  await dbClient.send(
    new PutItemCommand({
      TableName,
      Item: item,
    })
  );
  console.log("👌 updateSettings", item);
};
