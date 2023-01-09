import { Incident } from "./types";

export const DELAY_MS = 3000;

export const LOCAL_INCIDENTS = [] as Incident[];

export const WEBSOCKET = process.env.REACT_APP_WEBSOCKET || "";
