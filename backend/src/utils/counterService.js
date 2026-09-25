import Counter from '../models/Counter.js';

/**
 * Initializes counter documents for ambulance and hospital if they do not exist.
 * Sequence starts at 99 so the first atomic increment produces 100.
 */
export const initCounters = async () => {
  await Counter.updateOne(
    { _id: 'ambulance' },
    { $setOnInsert: { seq: 99 } },
    { upsert: true }
  );

  await Counter.updateOne(
    { _id: 'hospital' },
    { $setOnInsert: { seq: 99 } },
    { upsert: true }
  );
};

/**
 * Atomically increments sequence number for the specified sequence name.
 * @param {string} sequenceName - 'ambulance' or 'hospital'
 * @returns {Promise<number>} - Resulting sequence number
 */
export const getNextSequence = async (sequenceName) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true }
  );

  if (!counter) {
    // If not found yet, create with seq: 100 (first value)
    try {
      const created = await Counter.create({ _id: sequenceName, seq: 100 });
      return created.seq;
    } catch (err) {
      if (err.code === 11000) {
        const retry = await Counter.findOneAndUpdate(
          { _id: sequenceName },
          { $inc: { seq: 1 } },
          { new: true }
        );
        return retry.seq;
      }
      throw err;
    }
  }

  return counter.seq;
};

/**
 * Atomically generates next Ambulance ID (e.g. AMB-100, AMB-101)
 * @returns {Promise<string>}
 */
export const generateAmbulanceId = async () => {
  const seq = await getNextSequence('ambulance');
  return `AMB-${seq}`;
};

/**
 * Atomically generates next Hospital ID (e.g. HOSP-100, HOSP-101)
 * @returns {Promise<string>}
 */
export const generateHospitalId = async () => {
  const seq = await getNextSequence('hospital');
  return `HOSP-${seq}`;
};
