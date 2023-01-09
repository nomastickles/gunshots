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

  const currentIncidentInfo = React.useMemo(() => {
    let incident;

    if (currentIncidentIndex !== undefined) {
      const id = orderedIncidentIds[currentIncidentIndex];
      incident = incidents.find((i) => i.id === id);
    }

    if (!incident) {
      return {};
    }

    const stateTotals = metricsStateInfo[incident.state];

    return {
      incident,
      stateTotals,
    };
  }, [currentIncidentIndex, incidents, metricsStateInfo, orderedIncidentIds]);

  return {
    currentIncidentInfo,
    ...state,
  };
};
