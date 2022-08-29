import { createSlice } from "@reduxjs/toolkit";
import * as actions from "./actions";
import { WEBSOCKET_ENDPOINT_KEY } from "./constants";
import getDisplayDates from "./libs/getDisplayDates";
import orderStatesByTotals from "./libs/orderStatesByTotals";
import shuffleArray from "./libs/shuffleArray";
import { AppState, AppSteps, Metrics } from "./types";

export const initialState: AppState = {
  websocket: undefined,
  incidents: [],
  stepMap: {},
  orderedStateNames: [],
  orderedIncidentIds: [],
  currentIncidentIndex: undefined,
  metricsAll: undefined,
  metricsStateInfo: {},
  textDateRange: "",
};

export const AppSlice = createSlice({
  name: "app",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(actions.setStepValue, (state, { payload }) => {
      const newValue = payload.clear ? undefined : Date.now();
      state.stepMap[payload.step] = newValue;
    });

    builder.addCase(actions.websocketUpdate, (sliceState, { payload }) => {
      sliceState.websocket = payload;
      if (payload === undefined) {
        localStorage.removeItem(WEBSOCKET_ENDPOINT_KEY);
      } else {
        localStorage.setItem(WEBSOCKET_ENDPOINT_KEY, payload);
      }
    });

    builder.addCase(
      actions.setUSTerritoryData,
      (sliceState, { payload: incidents }) => {
        const metricsStateInfo: Record<string, Metrics> = {};
        const metricsAll: Metrics = {
          injured: 0,
          killed: 0,
        };

        incidents.forEach((incomingItem, index) => {
          const injured = incomingItem?.metrics?.injured || 0;
          const killed = incomingItem?.metrics?.killed || 0;
          metricsAll.injured += injured;
          metricsAll.killed += killed;

          if (!metricsStateInfo[incomingItem.state]) {
            metricsStateInfo[incomingItem.state] = {
              injured: 0,
              killed: 0,
            };
          }
          metricsStateInfo[incomingItem.state].killed += killed;
          metricsStateInfo[incomingItem.state].injured += injured;
        });

        sliceState.incidents = incidents; // preserve original order
        sliceState.currentIncidentIndex = undefined;
        sliceState.metricsStateInfo = metricsStateInfo;
        sliceState.metricsAll = metricsAll;
        sliceState.orderedStateNames = orderStatesByTotals(metricsStateInfo);
        sliceState.textDateRange = getDisplayDates(incidents);
        sliceState.orderedIncidentIds = shuffleArray(incidents).map(
          (i) => i.id
        );

        // trigger first incident
        sliceState.stepMap[AppSteps.INIT_NEXT_INCIDENT] = Date.now();
      }
    );

    builder.addCase(actions.selectNextIncident, (sliceState) => {
      if (
        sliceState.currentIncidentIndex === undefined ||
        sliceState.currentIncidentIndex === sliceState.incidents.length - 1
      ) {
        sliceState.currentIncidentIndex = 0;
      } else {
        sliceState.currentIncidentIndex += 1;
      }
    });
  },
});
