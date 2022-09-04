import { IncidentIncoming, Incident } from "@src/types";
import * as crypto from "crypto";
import * as libGeneral from "@libs/general";
import * as libIncidents from "@libs/incidents";
import { Response } from "node-fetch";
import * as google from "@libs/google";
import * as s3 from "@libs/s3";

export const getCombinedIncidentHashes = (items: Incident[]) =>
  items
    .map((i) => i.id.split(libGeneral.DIVIDER)[1])
    .sort()
    .join("");

export const getLocationStringFromIncident = (item: Incident) => {
  const address = item.address.replace(/[^\w ]/g, "");
  const location = encodeURI(`${address} ${item.city}, ${item.state}`);
  return location;
};

/**
 *
 *  newItem.id = `${currentSetId}${DIVIDER}${hashOfIncident}`;
 *
 * @param currentSetId
 * @param item
 * @param allPreviousImagesKeys
 * @param googleAPIKey
 * @returns
 */
export const createNewIncident = async (
  newIncidentSetId: string,
  item: IncidentIncoming,
  allPreviousImagesKeys: string[],
  googleAPIKey?: string
) => {
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
      JSON.stringify([
        newItem.date,
        newItem.address,
        newItem.city,
        newItem.metrics,
      ])
    )
    .digest("hex");

  if (!item.Address || !item.State || !item["City Or County"]) {
    /**
     * sanity validation checks
     */
    console.warn("initial validation", item);
    return undefined;
  }

  /**
   * 💥 the PK/id
   */
  newItem.id = `${newIncidentSetId}${libGeneral.DIVIDER}${hashOfIncident}`;

  if (newItem.address === "N/A") {
    console.log("🗺 🗄 🌕 no address to lookup", newItem);
    return newItem;
  }

  const previousS3Key = allPreviousImagesKeys?.find((key) =>
    key.includes(hashOfIncident)
  );

  if (previousS3Key) {
    console.log("🗺 🔎 image found", previousS3Key);
    newItem.image = `${libGeneral.S3BaseURL}${previousS3Key}`;

    return newItem;
  }

  if (!googleAPIKey) {
    console.warn("googleAPIKey missing. skipping new image.");
    return newItem;
  }

  const location = libIncidents.getLocationStringFromIncident(newItem);
  let googleResponse: Response;

  try {
    console.log("🗺 💰", hashOfIncident);
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
  const fileName = `${hashOfIncident}.jpeg`;
  await s3.uploadItem(fileName, buffer); // s3 uploads don't rate limit?
  newItem.image = `${libGeneral.S3BaseURL}${fileName}`;

  return newItem;
};
