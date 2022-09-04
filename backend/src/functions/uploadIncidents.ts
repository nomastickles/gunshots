import * as dynamodb from "@libs/dynamodb";
import * as libGeneral from "@libs/general";
import * as libIncidents from "@libs/incidents";
import { middyfy } from "@libs/middy";
import * as s3 from "@libs/s3";
import * as google from "@libs/google";
import * as sns from "@libs/sns";
import * as ssm from "@libs/ssm";
import { Incident, IncidentIncoming } from "@src/types";
import { SNSHandler } from "aws-lambda";
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
    throw new Error("no data");
  }

  console.log({ incomingRawData });

  try {
    const parsedData = papaparse.parse(incomingRawData, {
      header: true,
    });

    if (!parsedData.data) {
      throw new Error("no parsedData.data");
    }

    incidentsIncoming.push(...(parsedData.data as IncidentIncoming[]));
  } catch (err) {
    console.error("parsing broke");
    throw err;
  }

  if (!incidentsIncoming.length) {
    console.warn("no incidentsIncoming");
    return null;
  }

  const newIncidentSetId = libGeneral.getNewRandomWord();

  const googleAPIKey = await ssm.getParameter(process.env.SSM_PATH_GOOGLE_KEY);
  const incidentsAllPrevious = await dynamodb.getAllIncidents();
  const allPreviousImageKeys = await s3.fetchAllItemKeys();

  for (const incidentsBatch of libGeneral.batchArray(
    incidentsIncoming,
    google.GoogleBatchLimitPerSecond
  )) {
    const newIncidentsPromises = incidentsBatch.map(
      async (item: IncidentIncoming) => {
        try {
          const newIncidentResults = await libIncidents.createNewIncident(
            newIncidentSetId,
            item,
            allPreviousImageKeys,
            googleAPIKey
          );

          if (newIncidentResults) {
            incidentsToSave.push(newIncidentResults);
          }
        } catch (e) {
          console.error("🗺 ❌ incident error", item, e);
        }
      }
    );

    await Promise.all(newIncidentsPromises); // all at once

    if (incidentsIncoming.length > google.GoogleBatchLimitPerSecond) {
      // pausing since we can only do 500/second at a time
      await libGeneral.timeout(google.GoogleBatchLimitPerSecond * 3);
    }
  } // end of incident looping

  console.log("🙏 incidentsToSave", incidentsToSave);

  if (!incidentsToSave.length) {
    console.log("🌕 nothing to saved");
    return null;
  }

  if (
    libIncidents.getCombinedIncidentHashes(incidentsAllPrevious) ===
    libIncidents.getCombinedIncidentHashes(incidentsToSave)
  ) {
    console.warn("🌕 duplicate data");
    return null;
  }

  for (const item of incidentsToSave) {
    await dynamodb.addIncident(item);
  }

  /**
   * now that we've created all the dynamodb items with a new set id
   * we need to update our settings with new set id
   */
  await dynamodb.updateCurrentSetId(newIncidentSetId);

  /**
   * tell the frontend clients to update
   */
  await sns.sendMessage(
    process.env.SNS_SEND_INCIDENTS,
    sns.SEND_TO_ALL_INDICATOR
  );

  /**
   * find images with no known incoming hashes (to delete)
   * remember: S3 files names: <hash of db item>.jpg
   */
  const S3KeysToDelete = allPreviousImagesKeys.filter(
    (fileNameWithExtension) => {
      const hashOfIncident = fileNameWithExtension.split(".")[0];

      // incident id formed like <set id>:<hash>
      return !incidentsToSave.find((i) => i.id?.endsWith(hashOfIncident));
    }
  );

  if (S3KeysToDelete.length) {
    console.log("🌕 🌕 s3 keys to delete", S3KeysToDelete);
    await s3.deleteItems(S3KeysToDelete);
  }

  /**
   * let's delete all the incidents with old incident set value
   */
  for (const item of incidentsAllPrevious) {
    await dynamodb.removeItemByPrimaryKey(item.id);
  }
  return null;
};

export default middyfy(uploadIncidents);
