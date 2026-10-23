import { Router } from 'express';
import { getInventoryStatus, getDepots, getSkus, resetState } from '../services/inventoryService.js';

const router = Router();

// GET /api/inventory - returns full inventory state with depot & SKU details and balance status
router.get('/', async (req, res) => {
  try {
    const items = await getInventoryStatus();
    const depots = await getDepots();
    const skus = await getSkus();

    // Summary counts
    const deficits = items.filter(i => i.status === 'DEFICIT').length;
    const surpluses = items.filter(i => i.status === 'SURPLUS').length;
    const balanced = items.filter(i => i.status === 'BALANCED').length;
    const inTransitUnits = items.reduce((sum, i) => sum + (i.inTransit || 0), 0);
    const reservedUnits = items.reduce((sum, i) => sum + (i.reserved || 0), 0);

    res.status(200).json({
      summary: {
        totalDepots: depots.length,
        totalSkus: skus.length,
        totalTrackedItems: items.length,
        deficitsCount: deficits,
        surplusesCount: surpluses,
        balancedCount: balanced,
        inTransitUnits,
        reservedUnits
      },
      depots,
      skus,
      inventory: items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/reset - resets synthetic state back to default baseline
router.post('/reset', async (req, res) => {
  try {
    await resetState();
    res.status(200).json({ message: 'Inventory state reset to initial synthetic baseline' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
