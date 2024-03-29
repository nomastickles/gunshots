import React from "react";
import { useAppState } from "../hooks/useAppState";
import getCityStateString from "../libs/getCityStateString";
import { AppSteps } from "../types";

function Incident() {
  const { stepMap, currentIncidentInfo } = useAppState();
  const [visibleClass, setVisibleClass] = React.useState("invisible");
  const incident = currentIncidentInfo?.incident;
  const metrics = currentIncidentInfo?.incident?.metrics;
  const show = stepMap[AppSteps.SHOW_INCIDENT];
  const hide = stepMap[AppSteps.HIDE_INCIDENT];

  const cityState = getCityStateString(incident?.city, incident?.state);
  const incidentInfo = `${metrics?.killed || 0} KILLED + ${metrics?.injured || 0} INJURED`
  const stateInfo = `${
    currentIncidentInfo?.stateTotals?.killed || 0
  } killed + ${currentIncidentInfo?.stateTotals?.injured || 0} injured in ${
    incident?.state
  }`;
  const textDivClasses = `bg-zinc-100 text-base pt-2 ${
    incident?.image ? "-mt-7" : ""
  }`;

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

  return (
    <div
      data-testid="incident"
      className={`mt-2 lg:mt-20 xl:mt-28 text-base sm:text-2xl flex mt-6 p-3 w-full mx-auto absolute animate__animated animate__slow ${visibleClass}`}
    >
      <div className="rounded flex flex-col h-full mx-auto p-3 shadow-lg bg-zinc-100 max-w-2xl w-full">
        <div className={`rounded flex flex-col justify-center bg-gray-300`}>
          {incident?.image && (
            <img alt="incident" className="rounded-sm" src={incident?.image} />
          )}
        </div>

        <div className={textDivClasses}>
          <div className="flex mb-2">
            <div className="flex-none">
              <h2 className="text-gray-800">{incident?.date}</h2>
            </div>
            <div className="grow" />
            <div className="flex-none">
              <h2 className="text-red-500">{incidentInfo}</h2>
            </div>
          </div>

          <div className="text-gray-700 sm:float-left">
            <p className="text-xs">{incident?.address}</p>
            <p className="text-sm">{cityState}</p>
          </div>
          <div className="text-red-500 sm:float-right sm:text-right text-left">
            {!incidentInfo && <p>&nbsp;</p>}
            <p className="text-sm">&nbsp;</p>
            <p className="text-xs text-gray-500">{stateInfo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Incident;
