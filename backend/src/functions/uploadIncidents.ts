import { SNSHandler } from "aws-lambda";

import * as dynamodb from "../libs/dynamodb";
import * as libGeneral from "../libs/general";
import * as libIncidents from "../libs/incidents";
import { middyfy } from "../libs/middy";
import * as s3 from "../libs/s3";
import * as google from "../libs/google";
import * as sns from "../libs/sns";
import * as ssm from "../libs/ssm";
import { Incident, IncidentIncoming } from "../types";

const uploadIncidents: SNSHandler = async (event) => {
  const incomingRawData = event.Records[0]?.Sns?.Message;
  const incidentsToSave: Incident[] = [];

  if (!incomingRawData) {
    throw new Error("no data");
  }

  const incidentsIncoming =
    libIncidents.csvItemsToIncomingIncidents(incomingRawData);

  if (!incidentsIncoming?.length) {
    console.warn("no incidentsIncoming");
    return null;
  }

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
      await libGeneral.timeout(google.GoogleBatchLimitPerSecond * 2);
    }
  } // end of incident looping

  console.log("🙏 incidentsToSave", incidentsToSave);

  if (!incidentsToSave.length) {
    console.log("🌕 nothing to save");
    return null;
  }

  if (
    libIncidents.getCombinedIncidentIds(incidentsAllPrevious) ===
    libIncidents.getCombinedIncidentIds(incidentsToSave)
  ) {
    // just in case
    console.warn("🌕 duplicate data");
    return null;
  }
  await dynamodb.addAllIncidents(incidentsToSave);

  /**
   * initiate update for all frontend clients
   */
  await sns.sendMessage(
    process.env.SNS_TOPIC_SEND_INCIDENTS,
    sns.SEND_TO_ALL_INDICATOR
  );

  /**
   * now we need to start deleting the fold set items
   * find images with no known incoming ids (to delete)
   * remember: S3 files names: <item id>.jpeg
   */
  const S3KeysToDelete = allPreviousImageKeys.filter(
    (fileNameWithExtension) => {
      const idOfIncident = fileNameWithExtension.split(".")[0];

      return !incidentsToSave.find((i) => i.id == idOfIncident);
    }
  );

  if (S3KeysToDelete.length) {
    console.log("🌕 🌕 s3 keys to delete", S3KeysToDelete);
    await s3.deleteItems(S3KeysToDelete);
  }

  console.log("🟢 finished");

  return null;
};

export default middyfy(uploadIncidents);
