import prisma from '../db.js';
import { seed } from '../../prisma/seed.js';
import {
  calculateDeliveryMetrics,
  calculateVendorSlaMetrics,
  calculateNetworkVendorOverview
} from '../utils/slaCalculator.js';

/**
 * Resets vendor state back to synthetic baseline data by re-seeding PostgreSQL.
 */
export async function resetVendorState(client = prisma) {
  await seed(client);
}

/**
 * Lists all vendors enriched with authoritative SLA scorecard metrics.
 */
export async function getVendors(referenceTime = new Date(), client = prisma) {
  const vendorList = await client.vendor.findMany({ orderBy: { id: 'asc' } });
  const deliveryList = await client.vendorDelivery.findMany({ orderBy: { expectedDeliveryDate: 'desc' } });

  const overview = calculateNetworkVendorOverview(vendorList, deliveryList, referenceTime);
  return {
    overview,
    vendors: overview.scoredVendors
  };
}

/**
 * Retrieves a single vendor by ID with SLA scorecard and delivery history.
 */
export async function getVendorById(id, referenceTime = new Date(), client = prisma) {
  const vendor = await client.vendor.findUnique({ where: { id } });
  if (!vendor) {
    const error = new Error(`Vendor with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const vendorDeliveries = await client.vendorDelivery.findMany({
    where: { vendorId: id },
    orderBy: { expectedDeliveryDate: 'desc' }
  });

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
export async function createVendor(data, client = prisma) {
  const existing = await client.vendor.findUnique({ where: { id: data.id } });
  if (existing) {
    const error = new Error(`Vendor with ID '${data.id}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const dbCreated = await client.vendor.create({
    data: {
      id: data.id,
      name: data.name,
      category: data.category || 'General Supplies',
      contactEmail: data.contactEmail || '',
      leadTimeDays: data.leadTimeDays ?? 5,
      targetOtifRate: data.targetOtifRate ?? 95.0,
      isActive: data.isActive ?? true
    }
  });

  const allDeliveries = await client.vendorDelivery.findMany({ where: { vendorId: dbCreated.id } });
  return calculateVendorSlaMetrics(dbCreated, allDeliveries);
}

/**
 * Updates vendor profile or SLA configuration.
 */
export async function updateVendor(id, data, client = prisma) {
  const existing = await client.vendor.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error(`Vendor with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const dbUpdated = await client.vendor.update({
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

  const deliveries = await client.vendorDelivery.findMany({ where: { vendorId: id } });
  return calculateVendorSlaMetrics(dbUpdated, deliveries);
}

/**
 * Retrieves delivery records with optional filtering and pagination.
 */
export async function getDeliveries(query = {}, referenceTime = new Date(), client = prisma) {
  const where = {};
  if (query.vendorId) {
    where.vendorId = query.vendorId;
  }

  // If filtering by standard database status (DELIVERED, SCHEDULED, PARTIALLY_RECEIVED, CANCELLED)
  if (query.status && query.status.toUpperCase() !== 'OVERDUE') {
    where.status = query.status.toUpperCase();
  }

  const rawDeliveries = await client.vendorDelivery.findMany({
    where,
    orderBy: [
      { expectedDeliveryDate: 'desc' },
      { id: 'asc' }
    ]
  });

  let deliveryList = rawDeliveries;

  // Filter by virtual status: OVERDUE
  if (query.status && query.status.toUpperCase() === 'OVERDUE') {
    deliveryList = deliveryList.filter(d => {
      const metrics = calculateDeliveryMetrics(d, referenceTime);
      return metrics.isOverdue;
    });
  }

  const total = deliveryList.length;

  // Bounded pagination support
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
export async function getDeliveryById(id, referenceTime = new Date(), client = prisma) {
  const delivery = await client.vendorDelivery.findUnique({ where: { id } });
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
export async function createDelivery(data, referenceTime = new Date(), client = prisma) {
  // Validate that vendor exists in PostgreSQL
  const vendor = await client.vendor.findUnique({ where: { id: data.vendorId } });
  if (!vendor) {
    const error = new Error(`Cannot create delivery: Vendor with ID '${data.vendorId}' does not exist`);
    error.statusCode = 400;
    throw error;
  }

  const deliveryId = data.id || `DEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const dbCreated = await client.vendorDelivery.create({
    data: {
      id: deliveryId,
      vendorId: data.vendorId,
      poNumber: data.poNumber,
      skuId: data.skuId || null,
      depotId: data.depotId || null,
      expectedDeliveryDate: new Date(data.expectedDeliveryDate),
      actualDeliveryDate: data.actualDeliveryDate ? new Date(data.actualDeliveryDate) : null,
      expectedQuantity: data.expectedQuantity,
      receivedQuantity: data.receivedQuantity ?? 0,
      status: data.status || 'SCHEDULED',
      notes: data.notes || ''
    }
  });

  return {
    ...dbCreated,
    metrics: calculateDeliveryMetrics(dbCreated, referenceTime)
  };
}

/**
 * Updates a delivery record (e.g. recording arrival, received quantity, status).
 */
export async function updateDelivery(id, data, referenceTime = new Date(), client = prisma) {
  const existing = await client.vendorDelivery.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error(`Delivery with ID '${id}' not found`);
    error.statusCode = 404;
    throw error;
  }

  const dbUpdated = await client.vendorDelivery.update({
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
}
