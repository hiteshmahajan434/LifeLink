import {
  processExpiredHospitalRequests
} from './hospitalMatchingService.js';

const CHECK_INTERVAL_MS = 5000;

export const startHospitalBatchWorker = () => {
  setInterval(async () => {
    try {
      await processExpiredHospitalRequests();
    } catch (error) {
      console.error(
        'Hospital batch worker error:',
        error
      );
    }
  }, CHECK_INTERVAL_MS);
};