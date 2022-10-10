import { IncidentIncoming, Incident } from "@src/types";
import { Response } from "node-fetch";
import * as google from "@libs/google";
import * as s3 from "@libs/s3";
import papaparse from "papaparse";

export const SET_ID_DIVIDER = ":";

export const getCombinedIncidentIds = (items: Incident[]) =>
  items
    .map((i) => i.id.split(SET_ID_DIVIDER)[1])
    .sort()
    .join("");

export const getLocationStringFromIncident = (item: Incident) => {
  const address = item.address.replace(/[^\w ]/g, "");
  const location = encodeURI(`${address} ${item.city}, ${item.state}`);
  return location;
};

export const csvItemsToIncomingIncidents = (incomingRawData: string) => {
  const results: IncidentIncoming[] = [];
  try {
    const parsedData = papaparse.parse(incomingRawData, {
      header: true,
    });

    if (!parsedData.data) {
      throw new Error("no parsedData.data");
    }

    results.push(...(parsedData.data as IncidentIncoming[]));
  } catch (err) {
    console.error("parsing broke");
    throw err;
  }

  return results;
};

/**
 * @param currentSetId
 * @param item
 * @param allPreviousImagesKeys
 * @param googleAPIKey
 * @returns
 */
export const createNewIncident = async (
  newIncidentSetId: string,
  item: IncidentIncoming,
  allPreviousImageKeys: string[],
  googleAPIKey?: string
) => {
  const newItem: Incident = {
    id: `${newIncidentSetId}${SET_ID_DIVIDER}${item["Incident ID"]}`,
    date: item["Incident Date"],
    address: item.Address,
    city: item["City Or County"],
    state:
      item.State === "District of Columbia" ? "Washington, DC" : item.State,
    metrics: {
      injured: Number(item["# Injured"] || 0),
      killed: Number(item["# Killed"] || 0),
    },
  };

  const imageName = `${item["Incident ID"]}.jpeg`;

  if (newItem.address === "N/A") {
    console.log("🗺 🗄 🌕 no address to lookup", newItem);
    return newItem;
  }

  const previousS3Key = allPreviousImageKeys?.find((key) => key === imageName);

  if (previousS3Key) {
    console.log("🗺 🔎 image found", previousS3Key);
    newItem.image = `${s3.S3BaseURL}${previousS3Key}`;

    return newItem;
  }

  if (!googleAPIKey) {
    console.warn("googleAPIKey missing. skipping new image.");
    return newItem;
  }

  const location = getLocationStringFromIncident(newItem);
  let googleResponse: Response;

  try {
    console.log("🗺 💰", newItem.id);
    googleResponse = await google.fetchImage(googleAPIKey, location);
  } catch (e) {
    console.error("google fetch", item, e);
  }

  if (!googleResponse || googleResponse.status !== 200) {
    console.warn("🗺 🌕 no image available", googleResponse);
    // we should indicate on the dynamodb record that we've attempted to
    // find the image so as not to fetch again
    return newItem;
  }

  const buffer = await googleResponse.buffer();
  await s3.uploadItem(imageName, buffer); // s3 uploads don't rate limit?
  newItem.image = `${s3.S3BaseURL}${imageName}`;

  return newItem;
};
