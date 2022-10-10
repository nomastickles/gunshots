/**
 * pre formatted data
 */
export interface IncidentIncoming {
  "Incident ID": number;
  "Incident Date": string;
  "# Injured": number;
  "# Killed": number;
  State: string;
  "City Or County": string;
  Address: string;
  Operations: string;
}

/**
 * dynamoDB stored item
 */
export interface Incident {
  /**
   * 💥 the PK/id in the form of <currentSetId>:<id of CSV item>
   */
  id: string;
  date: string;
  state: string;
  city: string;
  address: string;

  /**
   * image S3 URL
   */
  image?: string;

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
