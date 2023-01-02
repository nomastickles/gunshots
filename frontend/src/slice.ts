import { createSlice } from "@reduxjs/toolkit";
import * as actions from "./actions";
import getDisplayDates from "./libs/getDisplayDates";
import orderStatesByTotals from "./libs/orderStatesByTotals";
import shuffleArray from "./libs/shuffleArray";
import { AppState, AppSteps, Incident, Metrics } from "./types";

export const initialState: AppState = {
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

    builder.addCase(
      actions.setUSTerritoryData,
      (sliceState, { payload: incomingIncidents }) => {
        const metricsStateInfo: Record<string, Metrics> = {};
        const metricsAll: Metrics = {
          injured: 0,
          killed: 0,
        };

        const incidentsWithImages: Incident[] = [];
        incomingIncidents.forEach((incomingItem, index) => {
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

          if (incomingItem.image) {
            // for now we'll only display the incidents with images
            incidentsWithImages.push(incomingItem);
          }
        });

        // preserving original order within incidents
        sliceState.incidents = incidentsWithImages;
        sliceState.currentIncidentIndex = undefined;
        sliceState.metricsStateInfo = metricsStateInfo;
        sliceState.metricsAll = metricsAll;
        sliceState.orderedStateNames = orderStatesByTotals(metricsStateInfo);

        // using incomingIncidents and not incidentsWithImages since I want the
        // full date range to be displayed
        sliceState.textDateRange = getDisplayDates(incomingIncidents);
        sliceState.orderedIncidentIds = shuffleArray(incidentsWithImages).map(
          (i) => i.id
        );

        // initiate/trigger first incident
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
