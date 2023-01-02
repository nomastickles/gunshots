import { createAction } from "@reduxjs/toolkit";
import { AppSteps, Incident } from "./types";

export const reset = createAction("reset");

interface SetSetValueProps {
  step: AppSteps;
  clear?: boolean;
}

export const setStepValue = createAction<SetSetValueProps>("setStepValue");

export const setUSTerritoryData =
  createAction<Incident[]>("setUSTerritoryData");

export const selectNextUSTerritory = createAction("selectNextUSTerritory");

export const selectNextIncident = createAction("selectNextIncident");
