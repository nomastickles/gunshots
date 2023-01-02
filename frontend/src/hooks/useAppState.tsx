import React from "react";
import { StateContext } from "../context";

export const useAppState = () => {
  const state = React.useContext(StateContext);

  const {
    incidents,
    currentIncidentIndex,
    orderedIncidentIds,
    metricsStateInfo,
  } = state;

  const getCurrentIncidentInfo = React.useCallback(() => {
    let item;

    if (currentIncidentIndex !== undefined) {
      const id = orderedIncidentIds[currentIncidentIndex];
      item = incidents.find((i) => i.id === id);
    }

    if (!item) {
      return {};
    }

    const stateTotals = metricsStateInfo[item.state];

    return {
      incident: item,
      total: incidents.length,
      stateTotals,
    };
  }, [currentIncidentIndex, incidents, metricsStateInfo, orderedIncidentIds]);

  return {
    getCurrentIncidentInfo,
    ...state,
  };
};
