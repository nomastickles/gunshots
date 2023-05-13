import { AttributeValue } from "@aws-sdk/client-dynamodb";

/**
 * pre formatted data
 */
export interface IncidentIncoming {
  "Incident ID": number;
  "Incident Date": string;
  "# Victims Injured": number;
  "# Victims Killed": number;
  State: string;
  "City Or County": string;
  Address: string;
  Operations: string;
}

/**
 * dynamoDB stored item
 */
export interface Incident {
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

export interface DynamoDBItem extends Record<string, AttributeValue> {
  /**
   * Partition Key
   * (could be paired with Sort key and called a
   * composite primary/partition key)
   */
  PK: {
    S: string; // could be <connectionId> or 'incidents' or 'websocket'
  };
  /**
   * Global Secondary Key
   * (paired with Global Secondary Sort key)
   */
  GSK?: {
    S: string;
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
