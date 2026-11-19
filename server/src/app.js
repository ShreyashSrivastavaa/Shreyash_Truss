import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import inventoryRoutes from './routes/inventoryRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import prisma, { checkDatabaseHealth } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend assets if built
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// Health check endpoint (Readiness probe verifying PostgreSQL connectivity)
app.get('/api/health', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  const client = req.app.locals.prisma !== undefined ? req.app.locals.prisma : prisma;
  const timeoutMs = req.app.locals.dbHealthTimeoutMs || 2000;
  const result = await checkDatabaseHealth(client, { timeoutMs });

  if (result.ok) {
    return res.status(200).json({
      status: 'ok',
      database: 'up'
    });
  }

  return res.status(503).json({
    status: 'unavailable',
    database: 'down'
  });
});

// Domain Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/vendors', vendorRoutes);

// Catch-all 404 handler for unknown API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Catch-all SPA handler: serve index.html for frontend navigation, or 404 if not found
app.use((req, res) => {
  if (req.method === 'GET' && fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler for malformed JSON and unhandled server errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Malformed JSON payload in request body'
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error'
  });
});

export default app;
