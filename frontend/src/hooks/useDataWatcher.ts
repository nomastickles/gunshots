import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sockette from "sockette";
import * as actions from "../actions";
import { IS_PUBLIC, LOCAL_DATA, WEBSOCKET_ENDPOINT_KEY } from "../constants";
import * as selectors from "../selectors";
import { AppSteps, Incident } from "../types";

const localIncidents = LOCAL_DATA.incidents as unknown as Incident[];
const WEBSOCKET_ENDPOINT = localStorage.getItem(WEBSOCKET_ENDPOINT_KEY);

const useDataWatcher = () => {
  const websocket = useSelector(selectors.getWebsocket);
  const websocketConnection: MutableRefObject<Sockette | undefined> = useRef();
  const dispatch = useDispatch();
  const stepMap = useSelector(selectors.getStepMap);
  const showInput = stepMap[AppSteps.SHOW_INPUT];

  /**
   * look for websocket on load
   * if we don't have it then show an input field
   */
  useEffect(() => {
    if (IS_PUBLIC) {
      return;
    }

    if (!WEBSOCKET_ENDPOINT) {
      dispatch(actions.setStepValue({ step: AppSteps.SHOW_INPUT }));
      return;
    }

    dispatch(actions.websocketUpdate(WEBSOCKET_ENDPOINT));
  }, [dispatch, showInput]);

  useEffect(() => {
    if (!IS_PUBLIC) {
      return;
    }
    const temp = setTimeout(() => {
      dispatch(actions.setUSTerritoryData(localIncidents));
    }, 2000);

    return () => clearTimeout(temp);
  }, [dispatch]);

  const onWebhookMessageReceived = useCallback(
    ({ data }: { data: string }) => {
      try {
        const results = JSON.parse(data) as Incident[];
        dispatch(actions.setUSTerritoryData(results));
      } catch (e) {
        console.error(e);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (IS_PUBLIC) {
      return;
    }
    if (!websocket) {
      return;
    }
    if (websocketConnection.current) {
      // only do this once
      return;
    }

    try {
      const url = `wss://${websocket.split("wss://").reverse()[0]}`;
      websocketConnection.current = new Sockette(url, {
        timeout: 2000,
        // maxAttempts: 10,
        onmessage: (e) => onWebhookMessageReceived(e),
        onopen: (e) => console.debug("connected:", e),
        onreconnect: (e) => console.debug("onmaximum", e),
        onmaximum: (e) => console.debug("onmaximum", e),
        onclose: (e) => {
          console.debug("onclose", e);
          window.location.reload();
        },
        onerror: (e) => {
          console.debug("onerror", e);
          websocketConnection.current = undefined;
          /**
           * setting websocket as undefined so that the input
           * form will be present to the user
           */
          dispatch(actions.websocketUpdate(undefined));
        },
      });
    } catch (e) {
      console.debug("connection error", e);
    }

    return () => {
      websocketConnection.current?.close();
      websocketConnection.current = undefined;
    };
  }, [dispatch, onWebhookMessageReceived, websocket]);
};

export default useDataWatcher;
