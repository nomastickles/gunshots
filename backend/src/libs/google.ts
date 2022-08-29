import fetch from "node-fetch";

export async function fetchImage(apiKey: string, location: string) {
  const imageLookupURL = `https://maps.googleapis.com/maps/api/streetview?return_error_code=true&size=640x640&location=${location}&key=${apiKey}`;
  const response = await fetch(imageLookupURL);
  return response;
}
