import { createAction } from "@reduxjs/toolkit";
import { SetStepProps, Incident } from "./types";

export const reset = createAction("reset");

export const setStepValue = createAction<SetStepProps>("setStepValue");

export const setUSTerritoryData =
  createAction<Incident[]>("setUSTerritoryData");

export const selectNextUSTerritory = createAction("selectNextUSTerritory");

export const selectNextIncident = createAction("selectNextIncident");

export const focusState = createAction<string>("focusState");
