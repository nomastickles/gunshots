import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import * as libGeneral from "@libs/general";
import { Incident } from "@src/types";

const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const TableName = process.env.DB_NAME;
const IndexName = process.env.DB_NAME_GSPK;

interface DynamoDBItem extends Record<string, any> {
  /**
   * Partition Key
   * (could be paired with Sort key and called a
   * composite primary/partition key)
   */
  PK: {
    S: string;
  };
  /**
   * Global Secondary Partition key
   * (paired with Global Secondary Sort key)
   */
  GSPK?: {
    S: string;
  };
  /**
   * Global Secondary Sort key
   */
  GSSK?: {
    N: string;
  };

  /**
   * storage for JSON
   */
  DATA?: {
    S: string;
  };
}

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

export const getAllConnectionsIds = async (exclusiveStartKey?: any) => {
  await libGeneral.timeout(libGeneral.DynamoDBReadTimeout);
  const { Items, LastEvaluatedKey } = await dbClient.send(
    new QueryCommand({
      TableName,
      IndexName,
      ExclusiveStartKey: exclusiveStartKey,
      KeyConditionExpression: "GSPK = :gspk",
      ExpressionAttributeValues: {
        ":gspk": { S: "connection" },
      },
    })
  );

  const results = Items.map((i) => i.PK.S);
  console.log("🤝🤝🤝 getAllConnectionsIds", { exclusiveStartKey });

  if (!LastEvaluatedKey) {
    return results;
  }

  const rest = await getAllConnectionsIds(LastEvaluatedKey);
  return [...results, ...rest];
};

export const getAllIncidents = async (
  exclusiveStartKey?: any
): Promise<Incident[]> => {
  await libGeneral.timeout(libGeneral.DynamoDBReadTimeout);
  const { Items, LastEvaluatedKey } = await dbClient.send(
    new QueryCommand({
      TableName,
      IndexName,
      ExclusiveStartKey: exclusiveStartKey,
      KeyConditionExpression: "GSPK = :gspk",
      ExpressionAttributeValues: {
        ":gspk": { S: "incident" },
      },
    })
  );

  const results = Items.map((i) => JSON.parse(i.DATA.S) as Incident);
  console.log("🫶 getAllIncidents", { exclusiveStartKey });

  if (!LastEvaluatedKey) {
    return results;
  }
  const rest = await getAllIncidents(LastEvaluatedKey);
  return [...results, ...rest];
};

/**
 * here we are using the image as a key since the name is already hashed
 * and we can add 'data' as the data store
 */
export const addIncident = async (incident: Incident) => {
  await libGeneral.timeout(libGeneral.DynamoDBWriteTimeout);
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
  await libGeneral.timeout(libGeneral.DynamoDBWriteTimeout);
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
  await libGeneral.timeout(libGeneral.DynamoDBReadTimeout);
  const { Items } = await dbClient.send(
    new QueryCommand({
      TableName,
      IndexName,
      KeyConditionExpression: "GSPK = :gspk",
      ExpressionAttributeValues: {
        ":gspk": { S: "setting" },
      },
    })
  );
  console.log("🤙 getSettings", Items);

  let currentSetId: string = undefined;
  let websocket: string = undefined;

  Items?.forEach((item: DynamoDBItem) => {
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
  await libGeneral.timeout(libGeneral.DynamoDBWriteTimeout);
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
