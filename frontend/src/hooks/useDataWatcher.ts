import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sockette from "sockette";
import * as actions from "../actions";
import { TEMP_DATA } from "../constants";
import * as selectors from "../selectors";
import { Incident } from "../types";

const useDataWatcher = () => {
  const websocket = useSelector(selectors.getWebsocket);
  const websocketConnection: MutableRefObject<Sockette | undefined> = useRef();
  const dispatch = useDispatch();
  const hasLocalData = !!TEMP_DATA;

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

  // useEffect(() => {
  //   if (!hasLocalData) {
  //     return;
  //   }
  //   if (!TEMP_DATA) {
  //     return;
  //   }
  //   const results = JSON.parse(TEMP_DATA) as Incident[];
  //   dispatch(actions.setUSTerritoryData(results));
  // }, [dispatch, hasLocalData]);

  useEffect(() => {
    if (hasLocalData) {
      return;
    }
    if (!websocket) {
      return;
    }
    if (websocketConnection.current) {
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
  }, [dispatch, hasLocalData, onWebhookMessageReceived, websocket]);
};

export default useDataWatcher;
