export type Metrics = {
  injured: number;
  killed: number;
};

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
   * we make this from a hash of the object
   * since source does not give us ids
   */
  id?: string;

  metrics?: Metrics;
}
