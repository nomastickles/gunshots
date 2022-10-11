import React from "react";
import { useSelector } from "react-redux";
import * as selectors from "./selectors";
import Loader from "./components/Loader";
import Incident from "./components/Incident";
import USAMap from "./components/USAMap/USAMap";
import useIncidentWatcher from "./hooks/useIncidentWatcher";
import useDataWatcher from "./hooks/useDataWatcher";
import useFadeClassHelper from "./hooks/useFadeClassHelper";

function App() {
  useDataWatcher();
  useIncidentWatcher();
  const fadeClass = useFadeClassHelper({
    classStart: "invisible",
    classEnd: "animate__fadeIn",
  });
  const metricsTotal = useSelector(selectors.getMeticsAll);
  const dates = useSelector(selectors.getTextDateRange);

  return (
    <div className="text-gray-100 uppercase">
      <Loader />
      <Incident />
      <USAMap />
      <div className="w-full fixed bottom-4 right-4 text-right animate__animated animate__fadeIn">
        <div className="md:flex flex-wrap md:h-4">
          <div className={`pl-8 ${fadeClass}`}>
            <div>{dates}</div>
          </div>
          <div className={`md:text-center flex-grow ml-20 ${fadeClass}`}>
            {dates && (
              <>
                {metricsTotal?.killed} Killed
                <span className="mr-2 ml-2"> + </span>
                {metricsTotal?.injured} Injured
              </>
            )}
          </div>

          <div className="md:-mt-5">
            <div className="text-xs">DATA FROM</div>
            <h2 className="text-lg">
              <a
                className="border border-dotted border-t-0 border-l-0 border-r-0 border-light-gray-100 border-opacity-25"
                rel="noreferrer"
                href="https://www.gunviolencearchive.org"
                target="_blank"
              >
                <span className="text-red-500">Gun Violence </span>Archive
              </a>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
