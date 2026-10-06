import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import ambulanceRoutes from './routes/ambulanceRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import hospitalResourceRoutes from './routes/hospitalResourceRoutes.js';
import hospitalRequestRoutes from './routes/hospitalRequestRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { hospitalBatchTimeout } from './inngest/hospitalBatchTimeout.js';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [
        hospitalBatchTimeout
    ],
  })
);

// Base API Routes
app.use('/api/health', healthRoutes);
app.use('/api/ambulance', ambulanceRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/hospital/resources', hospitalResourceRoutes);
app.use('/api/hospital/requests',hospitalRequestRoutes);

// Catch-all for undefined routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
