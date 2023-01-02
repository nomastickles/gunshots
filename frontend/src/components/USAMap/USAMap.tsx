import React from "react";

import { useAppState } from "../../hooks/useAppState";
import { AppSteps } from "../../types";
import "./styles.scss";
import SVGMap from "./svg-map";
import USA from "./svgPathData";

const heatMapBuckets = [
  [39, 50],
  [27, 38],
  [15, 26],
  [0, 14],
];

const USAMap = () => {
  const { stepMap, orderedStateNames, getCurrentIncidentInfo } = useAppState();
  const { incident } = getCurrentIncidentInfo();

  const currentUSTerritory = incident?.state || "";
  const isolateState = !!stepMap[AppSteps.ISOLATE_US_TERRITORY];

  const getLocationClassName = React.useCallback(
    (location: { name: string }) => {
      const stateName = location.name;
      const sortIndex = orderedStateNames.findIndex((i) => i === stateName);
      let heatMapValue = "";

      heatMapBuckets.forEach((bucket, index) => {
        if (sortIndex >= bucket[0] && sortIndex <= bucket[1]) {
          heatMapValue = `${index}`;
        }
      });

      let classes = `svg-map__location svg-map__location--heat${heatMapValue} animate__animated animate__slow animate__fadeIn`;

      if (!isolateState) {
        return classes;
      }

      const USTerritoryCurrentIndicator =
        currentUSTerritory === stateName
          ? "currentUSTerritory"
          : "animate__fadeOut";

      return classes + ` ${USTerritoryCurrentIndicator}`;
    },
    [currentUSTerritory, isolateState, orderedStateNames]
  );

  return (
    <div
      data-testid="USAMap"
      className="flex justify-center items-center w-full"
    >
      <div className="mt-5 w-11/12 md:w-3/4 lg:w-3/4 xl:w-2/3">
        <SVGMap map={USA} locationClassName={getLocationClassName} />
      </div>
    </div>
  );
};

export default USAMap;
