import { DIVIDER } from "@src/constants";
import { IncidentIncoming, Incident } from "@src/types";
import * as crypto from "crypto";

export const chunkArray = (arr: any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_v, i) =>
    arr.slice(i * size, i * size + size)
  );

export const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getNewRandomWord = () =>
  (Math.random() + 1).toString(36).substring(7);

export const getAllIncidentsHashesStringFromIncidents = (items: Incident[]) =>
  items
    .map((i) => i.id.split(DIVIDER)[1])
    .sort()
    .join("");

export const createNewItem = (currentSetId: string, item: IncidentIncoming) => {
  const newItem: Incident = {
    date: item["Incident Date"],
    address: item.Address,
    city: item["City Or County"],
    state:
      item.State === "District of Columbia" ? "Washington, DC" : item.State,
    metrics: {
      injured: Number(item["# Injured"] || 0),
      killed: Number(item["# Killed"] || 0),
    },
    id: null,
  };

  const hashOfIncident = crypto
    .createHash("md5")
    .update(
      JSON.stringify({
        0: newItem.date,
        1: newItem.address,
        2: newItem.city,
        3: newItem.metrics,
      })
    )
    .digest("hex");

  /**
   * 💥 create the PK/id
   */
  newItem.id = `${currentSetId}${DIVIDER}${hashOfIncident}`;

  return {
    item: newItem,
    hash: hashOfIncident,
  };
};

export const getLocationStringFromIncident = (item: Incident) => {
  const address = item.address.replace(/[^\w ]/g, "");
  const location = encodeURI(`${address} ${item.city}, ${item.state}`);
  return location;
};
