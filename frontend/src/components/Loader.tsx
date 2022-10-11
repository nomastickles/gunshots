import React from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import { IS_PUBLIC, WEBSOCKET_ENDPOINT_KEY } from "../constants";
import useFadeClassHelper from "../hooks/useFadeClassHelper";
import * as selectors from "../selectors";
import { AppSteps } from "../types";

const WEBSOCKET_ENDPOINT = localStorage.getItem(WEBSOCKET_ENDPOINT_KEY);

function Loader() {
  const dispatch = useDispatch();
  const websocket = useSelector(selectors.getWebsocket);
  const stepMap = useSelector(selectors.getStepMap);
  const visibleClass = useFadeClassHelper({
    classStart: "animate__fadeIn",
    classEnd: "animate__fadeOut",
  });
  const showInput = stepMap[AppSteps.SHOW_INPUT];

  /**
   * look for websocket on load
   * if we don't have it
   *
   * this only happens once since dispatch is static
   */
  React.useEffect(() => {
    if (IS_PUBLIC) {
      return;
    }

    if (!WEBSOCKET_ENDPOINT) {
      dispatch(actions.setStepValue({ step: AppSteps.SHOW_INPUT }));
      return;
    }

    dispatch(actions.websocketUpdate(WEBSOCKET_ENDPOINT));
  }, [dispatch]);

  const onInputChange = React.useCallback(
    (text: string) => {
      dispatch(actions.websocketUpdate(text));
      dispatch(
        actions.setStepValue({ step: AppSteps.SHOW_INPUT, clear: true })
      );
    },
    [dispatch]
  );

  return (
    <div
      className="flex top-2 justify-center items-center w-full fixed"
      data-testid="loader"
    >
      {showInput && (
        <div className="md:max-w-[30%] w-full">
          <input
            autoComplete="off"
            type="text"
            id="websocket"
            value={websocket}
            className=" w-full text-gray-700 text-sm bg-grey-light text-grey-darkest rounded p-3 focus:outline-none"
            placeholder="wss://"
            onChange={(event) => {
              onInputChange(event.target.value);
            }}
          />
        </div>
      )}

      {!showInput && (
        <div className={`space-x-1 text-red-300 ${visibleClass}`}>
          <span className="">Loading...</span>
        </div>
      )}
    </div>
  );
}

export default Loader;
