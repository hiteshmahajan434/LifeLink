import 'dotenv/config';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { startHospitalBatchWorker } from './src/services/hospitalBatchWorker.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  startHospitalBatchWorker();

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();
