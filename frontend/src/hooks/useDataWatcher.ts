import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import Sockette from "sockette";
import * as actions from "../actions";
import { LOCAL_DATA } from "../constants";
import { Incident } from "../types";

const localIncidents = LOCAL_DATA.incidents as unknown as Incident[];
const IS_LOCAL = !!localIncidents?.length;
const WEBSOCKET = process.env.REACT_APP_WEBSOCKET || "";

const useDataWatcher = () => {
  const websocketConnection: MutableRefObject<Sockette | undefined> = useRef();
  const dispatch = useDispatch();

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

  /**
   * IS_LOCAL
   */
  useEffect(() => {
    if (!IS_LOCAL) {
      return;
    }

    const temp = setTimeout(() => {
      dispatch(actions.setUSTerritoryData(localIncidents));
    }, 2000);

    return () => clearTimeout(temp);
  }, [dispatch]);

  useEffect(() => {
    if (IS_LOCAL) {
      return;
    }
    if (!WEBSOCKET) {
      console.log("🔌 NO WEBSOCKET FOUND");
      return;
    }
    if (websocketConnection.current) {
      // only do this once
      return;
    }

    try {
      const url = `wss://${WEBSOCKET.split("wss://").reverse()[0]}`;
      websocketConnection.current = new Sockette(url, {
        timeout: 2000,
        // maxAttempts: 10,
        onmessage: (e) => onWebhookMessageReceived(e),
        onopen: (e) => console.debug("connected:", e),
      });
    } catch (e) {
      console.debug("connection error", e);
    }

    return () => {
      websocketConnection.current?.close();
      websocketConnection.current = undefined;
    };
  }, [dispatch, onWebhookMessageReceived]);
};

export default useDataWatcher;
