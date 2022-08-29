import * as dynamodb from "@libs/dynamodb";
import * as generalLib from "@libs/general";
import * as google from "@libs/google";
import { middyfy } from "@libs/middy";
import * as s3 from "@libs/s3";
import * as sns from "@libs/sns";
import * as ssm from "@libs/ssm";
import * as constants from "@src/constants";
import { IncidentIncoming, Incident } from "@src/types";
import { SNSHandler } from "aws-lambda";
import { Response } from "node-fetch";
import papaparse from "papaparse";

/**
 *
 * dynamoDB items saved with PK in form:
 * <currentSetId><divider><hash of item>
 * example:
 * go01z:e93da9ed60cf0220e76d6e24487888ee
 *
 * s3 items images as
 * <hash of item>.jpg
 * example:
 * e93da9ed60cf0220e76d6e24487888ee.jpg
 *
 */
const uploadIncidents: SNSHandler = async (event) => {
  const incomingRawData = event.Records[0]?.Sns?.Message;
  const incidentsIncoming: IncidentIncoming[] = [];
  const incidentsToSave: Incident[] = [];

  if (!incomingRawData) {
    console.warn("no data");
    return;
  }

  try {
    const parsedData = papaparse.parse(incomingRawData, {
      header: true,
    }) as any;

    if (parsedData.data) {
      incidentsIncoming.push(...(parsedData.data as IncidentIncoming[]));
    }
  } catch (err) {
    console.error("parsing broke", err);
  }

  if (!incidentsIncoming.length) {
    console.warn("no incidentsIncoming");
    return;
  }

  const googleAPIKey = await ssm.getParameter(process.env.SSM_PATH_GOOGLE_KEY);

  if (!googleAPIKey) {
    // we don't do anything
    console.error("googleAPIKey missing");
    return;
  }

  const currentSetId = generalLib.getNewRandomWord();
  const incidentsAllPrevious = await dynamodb.getAllIncidents();
  const allPreviousImagesKeys = await s3.fetchAllImageKeys();

  for (const incidentsChunked of generalLib.chunkArray(
    incidentsIncoming,
    constants.GoogleBatchLimitPerSecond
  )) {
    const initializeIncidentsPromises = incidentsChunked.map(
      async (item: IncidentIncoming) => {
        try {
          if (!item.Address || !item.State || !item["City Or County"]) {
            /**
             * sanity validation checks
             */
            console.warn("initial validation", item);
            return;
          }

          const { item: newItem, hash: hashOfIncident } =
            generalLib.createNewItem(currentSetId, item);

          if (newItem.address === "N/A") {
            console.log("🗺 🗄 🌕 no address to lookup", newItem);
            incidentsToSave.push(newItem);
            return;
          }

          const previousS3Key = allPreviousImagesKeys?.find((key) =>
            key.includes(hashOfIncident)
          );

          if (previousS3Key) {
            console.log("🗺 🔎 image found", previousS3Key);
            newItem.image = `${constants.S3BaseURL}${previousS3Key}`;
            incidentsToSave.push(newItem);
            return;
          }

          const location = generalLib.getLocationStringFromIncident(newItem);
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
            incidentsToSave.push(newItem);
            return;
          }

          const buffer = await googleResponse.buffer();
          const fileName = `${hashOfIncident}.jpeg`;
          await s3.uploadImage(fileName, buffer); // s3 uploads don't rate limit?
          newItem.image = `${constants.S3BaseURL}${fileName}`;
          incidentsToSave.push(newItem);
        } catch (e) {
          console.error("🗺 ❌ incident error", item, e);
        }
      }
    );

    await Promise.all(initializeIncidentsPromises); // all at once

    if (incidentsIncoming.length > constants.GoogleBatchLimitPerSecond) {
      // pausing since we can only do 500/second at a time
      await generalLib.timeout(constants.GoogleBatchLimitPerSecond * 3);
    }
  } // end of incident looping

  console.log("🙏 incidentsToSave", incidentsToSave);

  if (!incidentsToSave.length) {
    return;
  }

  if (
    generalLib.getAllIncidentsHashesStringFromIncidents(
      incidentsAllPrevious
    ) === generalLib.getAllIncidentsHashesStringFromIncidents(incidentsToSave)
  ) {
    console.log("🛑 duplicate data");
    return;
  }

  for (const item of incidentsToSave) {
    await dynamodb.addIncident(item);
  }

  await dynamodb.updateCurrentSetId(currentSetId);

  /**
   * tell the frontend clients to update
   */
  await sns.sendMessage(
    process.env.SNS_SEND_INCIDENTS,
    constants.SEND_TO_ALL_INDICATOR
  );

  /**
   * find images with no known incoming hashes (to delete)
   */
  const S3KeysToDelete = allPreviousImagesKeys.filter((key) => {
    const hashOfIncident = key.split(".")[0];
    return !incidentsToSave.find((i) => i.id?.endsWith(hashOfIncident));
  });

  if (S3KeysToDelete.length) {
    console.log("🌕 🌕 s3 keys to delete", S3KeysToDelete);
    await s3.deleteImages(S3KeysToDelete);
  }

  /**
   * let's delete all the incidents with old value for set id prefix
   */
  for (const item of incidentsAllPrevious) {
    await dynamodb.removeItemByPrimaryKey(item.id);
  }
  return null;
};

export default middyfy(uploadIncidents);
