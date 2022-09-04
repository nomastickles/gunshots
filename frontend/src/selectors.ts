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

export const getCurrentIncidentInfo = createSelector(
  getIncidents,
  getCurrentIncidentIndex,
  getStateInfo,
  getOrderedIncidentIds,
  (incidents, currentIncidentIndex, stateInfo, orderedIncidentIds) => {
    if (currentIncidentIndex === undefined) {
      return {};
    }

    if (!incidents.length) {
      return {};
    }

    const id = orderedIncidentIds[currentIncidentIndex];
    const item = incidents.find((i) => i.id === id);

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
