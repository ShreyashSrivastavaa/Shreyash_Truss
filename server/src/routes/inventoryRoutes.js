import { Router } from 'express';
import { getInventoryStatus, getDepots, getSkus } from '../services/inventoryService.js';

const router = Router();

// GET /api/inventory - returns full inventory state with depot & SKU details and balance status
router.get('/', (req, res) => {
  try {
    const items = getInventoryStatus();
    const depots = getDepots();
    const skus = getSkus();

    // Summary counts
    const deficits = items.filter(i => i.status === 'DEFICIT').length;
    const surpluses = items.filter(i => i.status === 'SURPLUS').length;
    const balanced = items.filter(i => i.status === 'BALANCED').length;

    res.status(200).json({
      summary: {
        totalDepots: depots.length,
        totalSkus: skus.length,
        totalTrackedItems: items.length,
        deficitsCount: deficits,
        surplusesCount: surpluses,
        balancedCount: balanced
      },
      depots,
      skus,
      inventory: items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
