import { inngest } from "./client.js";

import HospitalEmergencyRequest from "../models/HospitalEmergencyRequest.js";
import EmergencyRequest from "../models/EmergencyRequest.js";

import { checkBatchAndCreateNext } from "../services/hospitalMatchingService.js";

export const hospitalBatchTimeout =
  inngest.createFunction(
    {
      id: "hospital-batch-timeout",
      triggers: {
        event: "hospital/batch.timeout",
      },
    },

    async ({ event, step }) => {
      const {
        emergencyId,
        batchNumber,
      } = event.data;

      console.log(
        `⏳ Batch ${batchNumber} timeout started for emergency ${emergencyId}`
      );

      // --------------------------------------------------
      // Wait for hospital response window
      // --------------------------------------------------

      await step.sleep(
        `wait-for-batch-${emergencyId}-${batchNumber}`,
        "60s"
      );

      // --------------------------------------------------
      // Check emergency state
      // --------------------------------------------------

      const emergency =
        await EmergencyRequest.findById(
          emergencyId
        );

      if (!emergency) {
        console.log(
          `⚠️ Emergency ${emergencyId} not found`
        );

        return {
          success: false,
          message: "Emergency not found",
        };
      }

      // --------------------------------------------------
      // Someone already accepted
      // --------------------------------------------------

      if (emergency.assignedHospital) {
        console.log(
          `✅ Emergency ${emergencyId} already assigned. Stopping timeout.`
        );

        return {
          success: true,
          message:
            "Emergency already assigned",
        };
      }

      // --------------------------------------------------
      // Get this specific batch
      // --------------------------------------------------

      const batchRequests =
        await HospitalEmergencyRequest.find({
          emergencyId,
          batchNumber,
        });

      if (batchRequests.length === 0) {
        console.log(
          `⚠️ Batch ${batchNumber} not found`
        );

        return {
          success: false,
          message:
            "Hospital batch not found",
        };
      }

      // --------------------------------------------------
      // Check whether somebody is still pending
      // --------------------------------------------------

      const hasPending =
        batchRequests.some(
          (request) =>
            request.status === "PENDING"
        );

      // --------------------------------------------------
      // All hospitals already responded
      // --------------------------------------------------

      if (!hasPending) {
        console.log(
          `ℹ️ Batch ${batchNumber} already completed before timeout`
        );

        return {
          success: true,
          message:
            "Batch already handled",
        };
      }

      // --------------------------------------------------
      // Timeout reached
      // Expire remaining pending requests
      // --------------------------------------------------

      const now = new Date();

      await HospitalEmergencyRequest.updateMany(
        {
          emergencyId,
          batchNumber,
          status: "PENDING",
        },
        {
          $set: {
            status: "EXPIRED",
            respondedAt: now,
          },
        }
      );

      console.log(
        `⌛ Batch ${batchNumber} expired`
      );

      // --------------------------------------------------
      // Start next batch
      // --------------------------------------------------

      const result =
        await checkBatchAndCreateNext(
          emergencyId,
          batchNumber
        );

      console.log(
        `➡️ Batch ${batchNumber} timeout handling completed`
      );

      return {
        success: true,
        emergencyId,
        batchNumber,
        result,
      };
    }
  );