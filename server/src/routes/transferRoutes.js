import { Router } from 'express';
import { createTransferSchema } from '../schemas/transferSchema.js';
import {
  getTransferOpportunities,
  executeTransfer,
  getTransferHistory
} from '../services/inventoryService.js';

const router = Router();

// GET /api/transfers/opportunities - lists calculated lateral transfer opportunities
router.get('/opportunities', (req, res) => {
  try {
    const opportunities = getTransferOpportunities();
    res.status(200).json({
      count: opportunities.length,
      opportunities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transfers - lists completed transfer history
router.get('/', (req, res) => {
  try {
    const history = getTransferHistory();
    res.status(200).json({
      count: history.length,
      transfers: history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transfers - validates and executes a lateral inventory transfer
router.post('/', (req, res) => {
  // Schema validation using Zod
  const validationResult = createTransferSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: (validationResult.error.issues || []).map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  try {
    const result = executeTransfer(validationResult.data);
    res.status(201).json({
      message: 'Transfer executed successfully',
      ...result
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: error.message
    });
  }
});

export default router;
