import * as dynamodb from "@libs/dynamodb";
import * as libGeneral from "@libs/general";
import * as libIncidents from "@libs/incidents";
import { middyfy } from "@libs/middy";
import * as s3 from "@libs/s3";
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
    console.warn("no data");
    return null;
  }

  try {
    const parsedData = papaparse.parse(incomingRawData, {
      header: true,
    });

    if (!parsedData.data) {
      throw new Error("no data");
    }

    incidentsIncoming.push(...(parsedData.data as IncidentIncoming[]));
  } catch (err) {
    console.error("parsing broke", err);
    return null;
  }

  if (!incidentsIncoming.length) {
    console.warn("no incidentsIncoming");
    return null;
  }

  const newIncidentSetId = libGeneral.getNewRandomWord();

  const googleAPIKey = await ssm.getParameter(process.env.SSM_PATH_GOOGLE_KEY);
  const incidentsAllPrevious = await dynamodb.getAllIncidents();
  const allPreviousImagesKeys = await s3.fetchAllItemKeys();

  for (const incidentsChunked of libGeneral.chunkArray(
    incidentsIncoming,
    libGeneral.GoogleBatchLimitPerSecond
  )) {
    const initializeIncidentsPromises = incidentsChunked.map(
      async (item: IncidentIncoming) => {
        try {
          const newIncidentResults = await libIncidents.createNewIncident(
            newIncidentSetId,
            item,
            allPreviousImagesKeys,
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

    await Promise.all(initializeIncidentsPromises); // all at once

    if (incidentsIncoming.length > libGeneral.GoogleBatchLimitPerSecond) {
      // pausing since we can only do 500/second at a time
      await libGeneral.timeout(libGeneral.GoogleBatchLimitPerSecond * 3);
    }
  } // end of incident looping

  console.log("🙏 incidentsToSave", incidentsToSave);

  if (!incidentsToSave.length) {
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
    libGeneral.SEND_TO_ALL_INDICATOR
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
