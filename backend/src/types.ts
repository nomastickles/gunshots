/**
 * pre formatted data
 */
export interface IncidentIncoming {
  ["# Injured"]: number;
  ["# Killed"]: number;
  "Incident Date": string;
  State: string;
  "City Or County": string;
  Address: string;
}

export interface Incident {
  date: string;
  state: string;
  city: string;
  address: string;

  /**
   * image S3 URL for hosting
   */
  image?: string;

  /**
   * id == <currentSetId>:<hash of db item>
   *
   * we make this from a hash of the object
   * since source does not give us ids
   */
  id?: string;

  metrics?: Metrics;
}

export type Metrics = {
  injured: number;
  killed: number;
};

export type DynamoDBItemName = "connection" | "incident" | "setting";

export interface DynamoDBItem extends Record<string, any> {
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
    S: DynamoDBItemName;
  };
  /**
   * Global Secondary Sort key
   */
  GSSK?: {
    N: string;
  };

  /**
   * storage for JSON or strings
   */
  DATA?: {
    S: string;
  };
}
