import prisma from '../db.js';
import { initialVendors, initialVendorDeliveries } from '../data/mockVendorData.js';
import {
  calculateDeliveryMetrics,
  calculateVendorSlaMetrics,
  calculateNetworkVendorOverview
} from '../utils/slaCalculator.js';

// In-memory working state (fallback & synthetic baseline)
let vendors = JSON.parse(JSON.stringify(initialVendors));
let deliveries = JSON.parse(JSON.stringify(initialVendorDeliveries));

/**
 * Resets vendor state back to synthetic baseline data.
 */
export async function resetVendorState() {
  vendors = JSON.parse(JSON.stringify(initialVendors));
  deliveries = JSON.parse(JSON.stringify(initialVendorDeliveries));

  if (prisma && prisma.vendorDelivery && prisma.vendor) {
    try {
      await prisma.vendorDelivery.deleteMany();
      await prisma.vendor.deleteMany();
    } catch {
      // In-memory fallback is always reset cleanly
    }
  }
}

/**
 * Lists all vendors enriched with authoritative SLA scorecard metrics.
 */
export async function getVendors(referenceTime = new Date()) {
  let vendorList = vendors;
  let deliveryList = deliveries;

  if (prisma && prisma.vendor && prisma.vendorDelivery) {
    try {
      const dbVendors = await prisma.vendor.findMany({ orderBy: { id: 'asc' } });
      const dbDeliveries = await prisma.vendorDelivery.findMany({ orderBy: { expectedDeliveryDate: 'desc' } });
      if (dbVendors.length > 0) {
        vendorList = dbVendors;
        deliveryList = dbDeliveries;
      }
    } catch {
      // Fall back to working in-memory state
    }
  }

  const overview = calculateNetworkVendorOverview(vendorList, deliveryList, referenceTime);
  return {
    overview,
    vendors: overview.scoredVendors
  };
}

/**
 * Retrieves a single vendor by ID with SLA scorecard and delivery history.
 */
export async function getVendorById(id, referenceTime = new Date()) {
  let vendor = vendors.find(v => v.id === id);
  let vendorDeliveries = deliveries.filter(d => d.vendorId === id);

  if (prisma && prisma.vendor && prisma.vendorDelivery) {
    try {
      const dbVendor = await prisma.vendor.findUnique({ where: { id } });
      if (dbVendor) {
        vendor = dbVendor;
        vendorDeliveries = await prisma.vendorDelivery.findMany({
          where: { vendorId: id },
          orderBy: { expectedDeliveryDate: 'desc' }
        });
      }
    } catch {
      // Fallback
    }
  }

  if (!vendor) {
    const error = new Error(`Vendor with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const scored = calculateVendorSlaMetrics(vendor, vendorDeliveries, referenceTime);
  const enrichedDeliveries = vendorDeliveries.map(d => ({
    ...d,
    metrics: calculateDeliveryMetrics(d, referenceTime)
  }));

  return {
    ...scored,
    deliveries: enrichedDeliveries
  };
}

/**
 * Registers a new vendor in the registry.
 */
export async function createVendor(data) {
  const existing = vendors.find(v => v.id === data.id);
  if (existing) {
    const error = new Error(`Vendor with ID '${data.id}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const newVendor = {
    id: data.id,
    name: data.name,
    category: data.category || 'General Supplies',
    contactEmail: data.contactEmail || '',
    leadTimeDays: data.leadTimeDays ?? 5,
    targetOtifRate: data.targetOtifRate ?? 95.0,
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  vendors.push(newVendor);

  if (prisma && prisma.vendor) {
    try {
      const dbCreated = await prisma.vendor.create({
        data: {
          id: newVendor.id,
          name: newVendor.name,
          category: newVendor.category,
          contactEmail: newVendor.contactEmail,
          leadTimeDays: newVendor.leadTimeDays,
          targetOtifRate: newVendor.targetOtifRate,
          isActive: newVendor.isActive
        }
      });
      return calculateVendorSlaMetrics(dbCreated, deliveries);
    } catch {
      // In-memory state already updated
    }
  }

  return calculateVendorSlaMetrics(newVendor, deliveries);
}

/**
 * Updates vendor profile or SLA configuration.
 */
export async function updateVendor(id, data) {
  const index = vendors.findIndex(v => v.id === id);
  if (index === -1) {
    const error = new Error(`Vendor with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const updated = {
    ...vendors[index],
    ...data,
    updatedAt: new Date().toISOString()
  };

  vendors[index] = updated;

  if (prisma && prisma.vendor) {
    try {
      const dbUpdated = await prisma.vendor.update({
        where: { id },
        data: {
          name: data.name,
          category: data.category,
          contactEmail: data.contactEmail,
          leadTimeDays: data.leadTimeDays,
          targetOtifRate: data.targetOtifRate,
          isActive: data.isActive
        }
      });
      return calculateVendorSlaMetrics(dbUpdated, deliveries);
    } catch {
      // Fallback
    }
  }

  return calculateVendorSlaMetrics(updated, deliveries);
}

/**
 * Retrieves delivery records with optional filtering and pagination.
 */
export async function getDeliveries(query = {}, referenceTime = new Date()) {
  let deliveryList = [...deliveries];

  if (prisma && prisma.vendorDelivery) {
    try {
      const dbDeliveries = await prisma.vendorDelivery.findMany({
        orderBy: { expectedDeliveryDate: 'desc' }
      });
      if (dbDeliveries.length > 0) {
        deliveryList = dbDeliveries;
      }
    } catch {
      // Fallback
    }
  }

  // Filter by vendorId
  if (query.vendorId) {
    deliveryList = deliveryList.filter(d => d.vendorId === query.vendorId);
  }

  // Filter by status or OVERDUE virtual status
  if (query.status) {
    const filterStatus = query.status.toUpperCase();
    if (filterStatus === 'OVERDUE') {
      deliveryList = deliveryList.filter(d => {
        const metrics = calculateDeliveryMetrics(d, referenceTime);
        return metrics.isOverdue;
      });
    } else {
      deliveryList = deliveryList.filter(d => d.status.toUpperCase() === filterStatus);
    }
  }

  // Sort descending by expected delivery date, tie-broken by ID
  deliveryList.sort((a, b) => {
    const dateDiff = new Date(b.expectedDeliveryDate).getTime() - new Date(a.expectedDeliveryDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.id.localeCompare(b.id);
  });

  const total = deliveryList.length;

  // Pagination support
  let paginated = deliveryList;
  if (query.limit !== undefined || query.offset !== undefined) {
    const offset = query.offset ? parseInt(query.offset, 10) : 0;
    const limit = query.limit ? Math.min(parseInt(query.limit, 10), 500) : 50;
    paginated = deliveryList.slice(offset, offset + limit);
  }

  const enriched = paginated.map(d => ({
    ...d,
    metrics: calculateDeliveryMetrics(d, referenceTime)
  }));

  return {
    count: enriched.length,
    total,
    deliveries: enriched
  };
}

/**
 * Retrieves a single delivery by ID.
 */
export async function getDeliveryById(id, referenceTime = new Date()) {
  let delivery = deliveries.find(d => d.id === id);

  if (prisma && prisma.vendorDelivery) {
    try {
      const dbDelivery = await prisma.vendorDelivery.findUnique({ where: { id } });
      if (dbDelivery) delivery = dbDelivery;
    } catch {
      // Fallback
    }
  }

  if (!delivery) {
    const error = new Error(`Delivery with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  return {
    ...delivery,
    metrics: calculateDeliveryMetrics(delivery, referenceTime)
  };
}

/**
 * Creates a new purchase order or delivery commitment.
 */
export async function createDelivery(data, referenceTime = new Date()) {
  // Validate that vendor exists
  const vendorExists = vendors.some(v => v.id === data.vendorId);
  if (!vendorExists) {
    const error = new Error(`Cannot create delivery: Vendor with ID '${data.vendorId}' does not exist`);
    error.statusCode = 400;
    throw error;
  }

  const deliveryId = data.id || `DEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newDelivery = {
    id: deliveryId,
    vendorId: data.vendorId,
    poNumber: data.poNumber,
    skuId: data.skuId || null,
    depotId: data.depotId || null,
    expectedDeliveryDate: data.expectedDeliveryDate,
    actualDeliveryDate: data.actualDeliveryDate || null,
    expectedQuantity: data.expectedQuantity,
    receivedQuantity: data.receivedQuantity ?? 0,
    status: data.status || 'SCHEDULED',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  deliveries.unshift(newDelivery);

  if (prisma && prisma.vendorDelivery) {
    try {
      const dbCreated = await prisma.vendorDelivery.create({
        data: {
          id: newDelivery.id,
          vendorId: newDelivery.vendorId,
          poNumber: newDelivery.poNumber,
          skuId: newDelivery.skuId,
          depotId: newDelivery.depotId,
          expectedDeliveryDate: new Date(newDelivery.expectedDeliveryDate),
          actualDeliveryDate: newDelivery.actualDeliveryDate ? new Date(newDelivery.actualDeliveryDate) : null,
          expectedQuantity: newDelivery.expectedQuantity,
          receivedQuantity: newDelivery.receivedQuantity,
          status: newDelivery.status,
          notes: newDelivery.notes
        }
      });
      return {
        ...dbCreated,
        metrics: calculateDeliveryMetrics(dbCreated, referenceTime)
      };
    } catch {
      // In-memory fallback
    }
  }

  return {
    ...newDelivery,
    metrics: calculateDeliveryMetrics(newDelivery, referenceTime)
  };
}

/**
 * Updates a delivery record (e.g. recording arrival, received quantity, status).
 */
export async function updateDelivery(id, data, referenceTime = new Date()) {
  const index = deliveries.findIndex(d => d.id === id);
  if (index === -1) {
    const error = new Error(`Delivery with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const existing = deliveries[index];

  const updated = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString()
  };

  deliveries[index] = updated;

  if (prisma && prisma.vendorDelivery) {
    try {
      const dbUpdated = await prisma.vendorDelivery.update({
        where: { id },
        data: {
          actualDeliveryDate: data.actualDeliveryDate !== undefined
            ? (data.actualDeliveryDate ? new Date(data.actualDeliveryDate) : null)
            : undefined,
          receivedQuantity: data.receivedQuantity !== undefined ? data.receivedQuantity : undefined,
          status: data.status !== undefined ? data.status : undefined,
          notes: data.notes !== undefined ? data.notes : undefined
        }
      });
      return {
        ...dbUpdated,
        metrics: calculateDeliveryMetrics(dbUpdated, referenceTime)
      };
    } catch {
      // Fallback
    }
  }

  return {
    ...updated,
    metrics: calculateDeliveryMetrics(updated, referenceTime)
  };
}
