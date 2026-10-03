import "dotenv/config";
import http from "http";

import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { initializeSocket } from "./src/socket/socket.js";
import { startHospitalBatchWorker } from "./src/services/hospitalBatchWorker.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  initializeSocket(server);

  startHospitalBatchWorker();

  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startServer();