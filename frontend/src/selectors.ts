import { createSelector } from "reselect";
import { AppSlice } from "./slice";
import { RootState } from "./index";
import { Incident } from "./types";

export const getStepMap = (state: RootState) => state[AppSlice.name].stepMap;

export const getWebsocket = (state: RootState) =>
  state[AppSlice.name].websocket || "";

export const getIncidents = (state: RootState): Incident[] =>
  state[AppSlice.name].incidents;

export const getCurrentIncidentIndex = (state: RootState) =>
  state[AppSlice.name].currentIncidentIndex;

export const getStateInfo = (state: RootState) =>
  state[AppSlice.name].metricsStateInfo;

export const getMeticsAll = (state: RootState) =>
  state[AppSlice.name].metricsAll;

export const getTextDateRange = (state: RootState) =>
  state[AppSlice.name].textDateRange;

export const getStateNamesOrderedByTotal = (state: RootState) =>
  state[AppSlice.name].orderedStateNames;

export const getOrderedIncidentIds = (state: RootState) =>
  state[AppSlice.name].orderedIncidentIds;

export const getCurrentIncident = createSelector(
  getIncidents,
  getCurrentIncidentIndex,
  getOrderedIncidentIds,
  (incidents, currentIncidentIndex, orderedIncidentIds) => {
    if (currentIncidentIndex === undefined) {
      return undefined;
    }

    const id = orderedIncidentIds[currentIncidentIndex];
    const item = incidents.find((i) => i.id === id);

    return item;
  }
);

export const getCurrentIncidentInfo = createSelector(
  getCurrentIncident,
  getIncidents,
  getStateInfo,
  (item, incidents, stateInfo) => {
    if (!item) {
      return {};
    }

    const stateTotals = stateInfo[item.state];

    return {
      incident: item,
      total: incidents.length,
      stateTotals,
    };
  }
);
