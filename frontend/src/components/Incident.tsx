import React from "react";
import { useSelector } from "react-redux";
import getCityStateString from "../libs/getCityStateString";
import * as selectors from "../selectors";
import { AppSteps } from "../types";

function Incident() {
  const [visibleClass, setVisibleClass] = React.useState("invisible");
  const currentIncidentInfo = useSelector(selectors.getCurrentIncidentInfo);
  const incident = currentIncidentInfo?.incident;
  const metrics = currentIncidentInfo?.incident?.metrics;
  const stepMap = useSelector(selectors.getStepMap);
  const show = stepMap[AppSteps.SHOW_INCIDENT];
  const hide = stepMap[AppSteps.HIDE_INCIDENT];
  const hideIncidentTotals = metrics?.killed === 0 && metrics?.injured === 0;
  const cityState = getCityStateString(incident?.city, incident?.state);

  React.useEffect(() => {
    if (show) {
      setVisibleClass("animate__fadeIn");
    }
  }, [show]);

  React.useEffect(() => {
    if (hide) {
      setVisibleClass("animate__fadeOut");
    }
  }, [hide]);

  let title = "";
  if (metrics?.killed !== undefined) {
    title = `${metrics?.killed} KILLED`;
  }

  if (metrics?.injured !== undefined) {
    const spacing = title ? " + " : "";
    title += `${spacing}${metrics?.injured} INJURED`;
  }

  if (hideIncidentTotals) {
    title = "";
  }

  return (
    <div
      data-testid="incident"
      className={`mt-2 lg:mt-20 xl:mt-28 text-base sm:text-2xl flex mt-6 p-3 w-full mx-auto absolute animate__animated animate__slow ${visibleClass}`}
    >
      <div className="rounded flex flex-col h-full mx-auto p-3 shadow-lg bg-zinc-100 max-w-2xl w-full">
        <div className={`rounded flex flex-col justify-center bg-gray-300`}>
          {!incident?.image && (
            <div className="font-light text-gray-400 text-center sm:h-96 h-60 sm:mt-60 mt-20">
              <p className="h-full align-middle">image unavailable</p>
            </div>
          )}
          {incident?.image && (
            <img alt="incident" className="rounded-sm" src={incident?.image} />
          )}
        </div>

        <div className="bg-zinc-100 text-base -mt-7 pt-2">
          <div className="text-gray-700 sm:float-left">
            <h2 className="text-gray-800">{incident?.date}</h2>
            <p className="text-xs">{incident?.address}</p>
            <p className="text-sm">{cityState}</p>
          </div>
          <div className="text-red-500 sm:float-right sm:text-right text-left">
            {title && <h2 className="text-red-500">{title || " "}</h2>}
            {!title && <p>&nbsp;</p>}
            <p className="text-sm">&nbsp;</p>
            <p className="text-xs text-gray-500">
              {currentIncidentInfo?.stateTotals?.killed} killed +{" "}
              {currentIncidentInfo?.stateTotals?.injured} injured in{" "}
              {incident?.state}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Incident;
