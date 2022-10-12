import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import * as libGeneral from "@libs/general";
import * as constants from "@src/constants";
import { DynamoDBItem, DynamoDBItemName, Incident } from "@src/types";

export const DynamoDBWriteTimeout = Math.round(
  (1 / constants.DynamoDBWriteCapacityUnits) * 1000
);
export const DynamoDBReadTimeout = Math.round(
  (1 / constants.DynamoDBReadCapacityUnits) * 1000
);

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TableName = process.env.DB_NAME;
const IndexName = process.env.DB_NAME_GSPK;

export const addConnection = async (connectionId: string) => {
  await libGeneral.timeout(DynamoDBWriteTimeout);
  const item: DynamoDBItem = {
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
  console.log("🤝 addConnection");
};

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
  console.log("➕🤟 created Incident", incident.id);
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

async function getAllItemsByGSPK(
  itemName: DynamoDBItemName,
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

  console.log("⚡️ getAllItemsByGSPK", { itemName, exclusiveStartKey });

  if (!LastEvaluatedKey) {
    return results;
  }

  const rest = await getAllItemsByGSPK(itemName, LastEvaluatedKey);
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

export const getSettings = async () => {
  const items = await getAllItemsByGSPK("setting");

  let currentSetId: string = undefined;
  let websocket: string = undefined;

  items?.forEach((item) => {
    const data = item.DATA?.S;
    switch (item.PK.S) {
      case "currentSetId":
        currentSetId = data;
        break;
      case "websocket":
        websocket = data;
        break;
      default:
    }
  });

  return {
    currentSetId,
    websocket,
  };
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
