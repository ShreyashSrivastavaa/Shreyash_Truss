// Synthetic demo data for Phase 6C: Vendor SLA Enforcement
// Covers: Reliable vendor, vendor with repeated delays, partially received delivery, overdue delivery, OTIF delivery, and cancelled delivery.

export const initialVendors = [
  {
    id: 'VND-APEX-01',
    name: 'Apex Thermal Technologies',
    category: 'Sensors & Cold-Chain Telemetry',
    contactEmail: 'orders@apexthermal.com',
    leadTimeDays: 4,
    targetOtifRate: 95.0,
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'VND-NORDIC-02',
    name: 'Nordic Cold-Chain Systems',
    category: 'Packaging & Thermal Insulation',
    contactEmail: 'dispatch@nordiccold.io',
    leadTimeDays: 6,
    targetOtifRate: 92.0,
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'VND-BIOGUARD-03',
    name: 'BioGuard Protective Logistics',
    category: 'Protective Containers & Seals',
    contactEmail: 'sla-desk@bioguard.net',
    leadTimeDays: 5,
    targetOtifRate: 90.0,
    isActive: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z'
  }
];

export const initialVendorDeliveries = [
  // 1. Apex Thermal Technologies (Reliable, high OTIF)
  {
    id: 'DEL-2026-001',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-041',
    skuId: 'SKU-MED-01',
    depotId: 'depot-north',
    expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
    actualDeliveryDate: '2026-10-09T14:30:00.000Z',
    expectedQuantity: 100,
    receivedQuantity: 100,
    status: 'DELIVERED',
    notes: 'Arrived 1 day early in perfect condition. OTIF compliant.',
    createdAt: '2026-10-05T09:00:00.000Z',
    updatedAt: '2026-10-09T15:00:00.000Z'
  },
  {
    id: 'DEL-2026-002',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-048',
    skuId: 'SKU-MED-01',
    depotId: 'depot-south',
    expectedDeliveryDate: '2026-10-15T00:00:00.000Z',
    actualDeliveryDate: '2026-10-15T11:00:00.000Z',
    expectedQuantity: 150,
    receivedQuantity: 150,
    status: 'DELIVERED',
    notes: 'On-time delivery at South Distribution Center dock.',
    createdAt: '2026-10-11T10:00:00.000Z',
    updatedAt: '2026-10-15T12:00:00.000Z'
  },
  {
    id: 'DEL-2026-003',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-055',
    skuId: 'SKU-IND-02',
    depotId: 'depot-east',
    expectedDeliveryDate: '2026-10-22T00:00:00.000Z',
    actualDeliveryDate: '2026-10-21T16:00:00.000Z',
    expectedQuantity: 80,
    receivedQuantity: 80,
    status: 'DELIVERED',
    notes: 'Dock intake completed without exceptions.',
    createdAt: '2026-10-17T08:30:00.000Z',
    updatedAt: '2026-10-21T16:30:00.000Z'
  },
  {
    id: 'DEL-2026-004',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-062',
    skuId: 'SKU-MED-01',
    depotId: 'depot-north',
    expectedDeliveryDate: '2026-11-05T00:00:00.000Z',
    actualDeliveryDate: null,
    expectedQuantity: 120,
    receivedQuantity: 0,
    status: 'SCHEDULED',
    notes: 'Future scheduled replenishment order; in production.',
    createdAt: '2026-10-25T11:00:00.000Z',
    updatedAt: '2026-10-25T11:00:00.000Z'
  },

  // 2. Nordic Cold-Chain Systems (Chronic delays, partial intake, overdue shipment)
  {
    id: 'DEL-2026-005',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-039',
    skuId: 'SKU-IND-02',
    depotId: 'depot-south',
    expectedDeliveryDate: '2026-10-05T00:00:00.000Z',
    actualDeliveryDate: '2026-10-09T10:00:00.000Z',
    expectedQuantity: 200,
    receivedQuantity: 200,
    status: 'DELIVERED',
    notes: 'Arrived 4 days late due to carrier logistics delay.',
    createdAt: '2026-09-28T14:00:00.000Z',
    updatedAt: '2026-10-09T11:00:00.000Z'
  },
  {
    id: 'DEL-2026-006',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-045',
    skuId: 'SKU-MED-01',
    depotId: 'depot-north',
    expectedDeliveryDate: '2026-10-12T00:00:00.000Z',
    actualDeliveryDate: '2026-10-16T15:00:00.000Z',
    expectedQuantity: 150,
    receivedQuantity: 150,
    status: 'DELIVERED',
    notes: 'Second consecutive late shipment (4 days late).',
    createdAt: '2026-10-06T09:30:00.000Z',
    updatedAt: '2026-10-16T15:30:00.000Z'
  },
  {
    id: 'DEL-2026-007',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-052',
    skuId: 'SKU-IND-02',
    depotId: 'depot-east',
    expectedDeliveryDate: '2026-10-20T00:00:00.000Z',
    actualDeliveryDate: '2026-10-20T12:00:00.000Z',
    expectedQuantity: 120,
    receivedQuantity: 90,
    status: 'PARTIALLY_RECEIVED',
    notes: 'Dock intake exception: 30 units damaged in transit and rejected. Partial intake.',
    createdAt: '2026-10-14T08:00:00.000Z',
    updatedAt: '2026-10-20T13:00:00.000Z'
  },
  {
    id: 'DEL-2026-008',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-059',
    skuId: 'SKU-MED-01',
    depotId: 'depot-south',
    expectedDeliveryDate: '2026-10-24T00:00:00.000Z',
    actualDeliveryDate: null,
    expectedQuantity: 100,
    receivedQuantity: 0,
    status: 'DELAYED',
    notes: 'Shipment overdue by 4+ days. Supplier factory reported backlog.',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-25T09:00:00.000Z'
  },

  // 3. BioGuard Protective Logistics (Mixed record, cancelled order)
  {
    id: 'DEL-2026-009',
    vendorId: 'VND-BIOGUARD-03',
    poNumber: 'PO-2026-044',
    skuId: 'SKU-MED-01',
    depotId: 'depot-east',
    expectedDeliveryDate: '2026-10-14T00:00:00.000Z',
    actualDeliveryDate: '2026-10-14T09:00:00.000Z',
    expectedQuantity: 60,
    receivedQuantity: 60,
    status: 'DELIVERED',
    notes: 'On-time delivery to East Gateway Depot.',
    createdAt: '2026-10-09T08:00:00.000Z',
    updatedAt: '2026-10-14T09:30:00.000Z'
  },
  {
    id: 'DEL-2026-010',
    vendorId: 'VND-BIOGUARD-03',
    poNumber: 'PO-2026-050',
    skuId: 'SKU-IND-02',
    depotId: 'depot-north',
    expectedDeliveryDate: '2026-10-18T00:00:00.000Z',
    actualDeliveryDate: '2026-10-20T14:00:00.000Z',
    expectedQuantity: 80,
    receivedQuantity: 80,
    status: 'DELIVERED',
    notes: 'Delayed 2 days due to freight rerouting.',
    createdAt: '2026-10-13T10:30:00.000Z',
    updatedAt: '2026-10-20T14:30:00.000Z'
  },
  {
    id: 'DEL-2026-011',
    vendorId: 'VND-BIOGUARD-03',
    poNumber: 'PO-2026-057',
    skuId: 'SKU-MED-01',
    depotId: 'depot-south',
    expectedDeliveryDate: '2026-10-28T00:00:00.000Z',
    actualDeliveryDate: null,
    expectedQuantity: 50,
    receivedQuantity: 0,
    status: 'CANCELLED',
    notes: 'Order cancelled before dispatch. Excluded from historical SLA compliance metrics.',
    createdAt: '2026-10-22T13:00:00.000Z',
    updatedAt: '2026-10-24T16:00:00.000Z'
  }
];
