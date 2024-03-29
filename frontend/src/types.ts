export interface MonthProps {
  firstDay: string;
  lastDay?: string;
  year: string;
}

export type Metrics = {
  injured: number;
  killed: number;
};
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
  id: string;

  metrics?: Metrics;
}

export enum AppSteps {
  ISOLATE_US_TERRITORY = "ISOLATE_US_TERRITORY",
  INIT_NEXT_INCIDENT = "INIT_NEXT_INCIDENT",
  SHOW_INCIDENT = "SHOW_INCIDENT",
  HIDE_INCIDENT = "HIDE_INCIDENT",
  IS_PUBIC = "IS_PUBIC",
}

export type AppState = {
  incidents: Incident[];
  stepMap: Partial<Record<AppSteps, number>>;
  /**
   * array with names of states
   * ordered by total number of incidents
   */
  orderedStateNames: string[];
  orderedIncidentIds: string[];
  currentIncidentIndex?: number;
  metricsStateInfo: Partial<Record<string, Metrics>>;
  metricsAll?: Metrics;
  textDateRange?: string;

  /**
   * if a user clicks a state let's only show incidents from that state
   */
  focusedState?: string;
};

export interface SetStepProps {
  step: AppSteps;
  clear?: boolean;
}
