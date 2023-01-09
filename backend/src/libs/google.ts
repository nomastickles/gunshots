import fetch from "node-fetch";

/**
 * https://developers.google.com/maps/documentation/streetview/usage-and-billing
 *
 * 30,000 per minute / 60 seconds = 500 per second
 */
export const GoogleBatchLimitPerSecond = 500;

export async function fetchImage(apiKey: string, location: string) {
  const imageLookupURL = `https://maps.googleapis.com/maps/api/streetview?return_error_code=true&size=640x640&location=${location}&key=${apiKey}`;
  const response = await fetch(imageLookupURL);
  return response;
}
