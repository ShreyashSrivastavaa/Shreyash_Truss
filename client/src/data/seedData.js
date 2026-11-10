/**
 * Authoritative Indian Supply Chain Seed Data for Nexus Product 18
 * Conforms strictly to Indian cities, INR pricing, GST structures,
 * and preserves baseline OTIF (50%), In-Full (87.5%), On-Time (62.5%), and 495 physical units.
 */

export const INITIAL_DEPOTS = [
  {
    id: 'depot-north',
    name: 'North Logistics Hub',
    city: 'Gurugram, Haryana (Delhi NCR)',
    region: 'North',
    gstin: '06AABCT9988C1Z4',
    address: 'Sector 37, Pace City II Industrial Area, Gurugram, HR 122001',
    manager: 'Rohit Chauhan',
    contactPhone: '+91 98101 44520',
    capacityUnits: 350,
    coordinates: { lat: 28.4595, lng: 77.0266 }
  },
  {
    id: 'depot-south',
    name: 'South Distribution Center',
    city: 'Chennai, Tamil Nadu',
    region: 'South',
    gstin: '33AABCS7766D1Z2',
    address: 'SIPCOT Industrial Park, Sriperumbudur Corridor, Chennai, TN 602105',
    manager: 'Meera Krishnan',
    contactPhone: '+91 94440 88912',
    capacityUnits: 400,
    coordinates: { lat: 12.9716, lng: 79.9414 }
  },
  {
    id: 'depot-east',
    name: 'East Gateway Depot',
    city: 'Kolkata, West Bengal',
    region: 'East',
    gstin: '19AABCE5544E1Z9',
    address: 'Netaji Subhash Dock Maritime Complex, Kolkata Port, WB 700043',
    manager: 'Amit Banerjee',
    contactPhone: '+91 98300 22109',
    capacityUnits: 250,
    coordinates: { lat: 22.5400, lng: 88.3100 }
  }
];

export const INITIAL_SKUS = [
  {
    id: 'SKU-IND-02',
    name: 'Industrial Temperature Relay',
    category: 'Industrial Switchgear & Automation',
    unit: 'units',
    unitCost: 2450, // ₹2,450 per unit
    hsnCode: '8536.49.00',
    gstRate: 0.18,
    leadTimeDays: 3
  },
  {
    id: 'SKU-MED-01',
    name: 'Emergency Cold-Chain Sensor Pack',
    category: 'Cold-Chain IoT & Pharma Telemetry',
    unit: 'boxes',
    unitCost: 8900, // ₹8,900 per box
    hsnCode: '9025.19.90',
    gstRate: 0.18,
    leadTimeDays: 4
  }
];

export const INITIAL_INVENTORY = [
  // SKU-MED-01 (₹8,900/unit): Deficit in North, Surplus in South, Balanced in East
  {
    depotId: 'depot-north',
    skuId: 'SKU-MED-01',
    onHand: 25,
    reserved: 0,
    inTransit: 0,
    safetyStock: 50,
    targetStock: 120
  },
  {
    depotId: 'depot-south',
    skuId: 'SKU-MED-01',
    onHand: 190,
    reserved: 0,
    inTransit: 0,
    safetyStock: 40,
    targetStock: 100
  },
  {
    depotId: 'depot-east',
    skuId: 'SKU-MED-01',
    onHand: 70,
    reserved: 0,
    inTransit: 0,
    safetyStock: 30,
    targetStock: 70
  },
  // SKU-IND-02 (₹2,450/unit): Surplus in North, Deficit in South, Balanced in East
  {
    depotId: 'depot-north',
    skuId: 'SKU-IND-02',
    onHand: 150,
    reserved: 0,
    inTransit: 0,
    safetyStock: 30,
    targetStock: 80
  },
  {
    depotId: 'depot-south',
    skuId: 'SKU-IND-02',
    onHand: 20,
    reserved: 0,
    inTransit: 0,
    safetyStock: 35,
    targetStock: 80
  },
  {
    depotId: 'depot-east',
    skuId: 'SKU-IND-02',
    onHand: 40,
    reserved: 0,
    inTransit: 0,
    safetyStock: 25,
    targetStock: 60
  }
];

// Editable demo constants for inter-depot lanes
export const LANE_CONSTANTS = {
  'depot-north->depot-south': {
    originCity: 'Gurugram (NCR)',
    destCity: 'Chennai',
    distanceKm: 2180,
    transitTimeEstimate: '3-4 days by road (NH 44 Express Corridor)',
    estimatedFreightCostRelay: 18500, // ₹18,500 for 60 units relay
    estimatedFreightCostSensor: 24000,
    stockoutLossAvoidedRelay: 294000, // ₹2,94,000
    stockoutLossAvoidedSensor: 1424000,
    defaultTransporter: 'VRL Bharat Freightways',
    transporterGst: '29AABCV1234F1Z8'
  },
  'depot-south->depot-north': {
    originCity: 'Chennai',
    destCity: 'Gurugram (NCR)',
    distanceKm: 2180,
    transitTimeEstimate: '3-4 days by road (Reefer Cold-Chain Container)',
    estimatedFreightCostRelay: 18500,
    estimatedFreightCostSensor: 24000, // ₹24,000 for 90 units sensor pack
    stockoutLossAvoidedRelay: 294000,
    stockoutLossAvoidedSensor: 1424000, // ₹14,24,000
    defaultTransporter: 'GatiShakti Express Logistics',
    transporterGst: '36AABCG9876H1Z2'
  },
  'depot-east->depot-south': {
    originCity: 'Kolkata',
    destCity: 'Chennai',
    distanceKm: 1670,
    transitTimeEstimate: '2-3 days by road (NH 16 East Coast)',
    estimatedFreightCostRelay: 14200,
    estimatedFreightCostSensor: 19500,
    stockoutLossAvoidedRelay: 220000,
    stockoutLossAvoidedSensor: 980000,
    defaultTransporter: 'TCI Supply Chain Solutions',
    transporterGst: '19AABCT5566J1Z1'
  }
};

export const INITIAL_VENDORS = [
  {
    id: 'VND-APEX-01',
    name: 'Apex Thermal Technologies',
    category: 'Sensors & Cold-Chain Telemetry',
    location: 'Pune, Maharashtra',
    gstin: '27AAACA1234A1Z1',
    contactPerson: 'Vikram Shah',
    contactEmail: 'orders@apexthermal.in',
    contactPhone: '+91 98220 14590',
    leadTimeDays: 4,
    targetOtifRate: 95.0,
    isActive: true,
    rating: 4.8,
    slaPenaltyRatePercent: 2.0, // 2% per week delayed
    orderValueAtRisk: 0,
    status: 'COMPLIANT',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'VND-NORDIC-02',
    name: 'Nordic Cold-Chain Systems',
    category: 'Packaging & Thermal Insulation',
    location: 'Nhava Sheva / Mumbai, Maharashtra (Import Distributor)',
    gstin: '27AABCN8899B1Z8',
    contactPerson: 'Arjun Malhotra',
    contactEmail: 'dispatch@nordiccold.in',
    contactPhone: '+91 98190 77620',
    leadTimeDays: 6,
    targetOtifRate: 92.0,
    isActive: true,
    rating: 2.4,
    slaPenaltyRatePercent: 5.0,
    orderValueAtRisk: 1068000, // ₹10.68 L
    status: 'BREACH',
    createdAt: '2026-09-01T08:00:00.000Z'
  },
  {
    id: 'VND-BIOGUARD-03',
    name: 'BioGuard Protective Logistics',
    category: 'Protective Containers & Seals',
    location: 'Ahmedabad, Gujarat',
    gstin: '24AAAAA0000A1Z5',
    contactPerson: 'Ramesh Patel',
    contactEmail: 'sla-desk@bioguard.in',
    contactPhone: '+91 98795 33210',
    leadTimeDays: 5,
    targetOtifRate: 90.0,
    isActive: true,
    rating: 3.6,
    slaPenaltyRatePercent: 3.5,
    orderValueAtRisk: 445000, // ₹4.45 L
    status: 'BREACH',
    createdAt: '2026-09-01T08:00:00.000Z'
  }
];

export const INITIAL_VENDOR_DELIVERIES = [
  // 1. Apex Thermal Technologies (Reliable, high OTIF)
  {
    id: 'DEL-2026-001',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-041',
    skuId: 'SKU-MED-01',
    skuName: 'Emergency Cold-Chain Sensor Pack',
    depotId: 'depot-north',
    depotName: 'North Logistics Hub (Gurugram)',
    expectedDeliveryDate: '2026-10-10T00:00:00.000Z',
    actualDeliveryDate: '2026-10-09T14:30:00.000Z',
    expectedQuantity: 100,
    receivedQuantity: 100,
    unitPrice: 8900,
    baseAmount: 890000,
    gstAmount: 160200,
    totalAmount: 1050200,
    status: 'DELIVERED',
    lrNumber: 'LR-PUN-DEL-1049',
    ewayBillNumber: 'EWB-271048291044',
    vehicleNumber: 'MH-12-PQ-7712',
    transporterName: 'VRL Bharat Freightways',
    notes: 'Arrived 1 day early at Gurugram hub. Dock intake completed. OTIF compliant.',
    createdAt: '2026-10-05T09:00:00.000Z'
  },
  {
    id: 'DEL-2026-002',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-048',
    skuId: 'SKU-MED-01',
    skuName: 'Emergency Cold-Chain Sensor Pack',
    depotId: 'depot-south',
    depotName: 'South Distribution Center (Chennai)',
    expectedDeliveryDate: '2026-10-15T00:00:00.000Z',
    actualDeliveryDate: '2026-10-15T11:00:00.000Z',
    expectedQuantity: 150,
    receivedQuantity: 150,
    unitPrice: 8900,
    baseAmount: 1335000,
    gstAmount: 240300,
    totalAmount: 1575300,
    status: 'DELIVERED',
    lrNumber: 'LR-PUN-CHN-2091',
    ewayBillNumber: 'EWB-271059281903',
    vehicleNumber: 'MH-14-GH-4921',
    transporterName: 'BlueDart Surface India',
    notes: 'On-time delivery at Chennai Sriperumbudur dock. Sensor QC passed 100%.',
    createdAt: '2026-10-11T10:00:00.000Z'
  },
  {
    id: 'DEL-2026-003',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-055',
    skuId: 'SKU-IND-02',
    skuName: 'Industrial Temperature Relay',
    depotId: 'depot-east',
    depotName: 'East Gateway Depot (Kolkata)',
    expectedDeliveryDate: '2026-10-22T00:00:00.000Z',
    actualDeliveryDate: '2026-10-21T16:00:00.000Z',
    expectedQuantity: 80,
    receivedQuantity: 80,
    unitPrice: 2450,
    baseAmount: 196000,
    gstAmount: 35280,
    totalAmount: 231280,
    status: 'DELIVERED',
    lrNumber: 'LR-PUN-KOL-3310',
    ewayBillNumber: 'EWB-271077281944',
    vehicleNumber: 'MH-12-RT-8819',
    transporterName: 'GatiShakti Express Logistics',
    notes: 'Dock intake completed at Kolkata Port facility without exceptions.',
    createdAt: '2026-10-17T08:30:00.000Z'
  },
  {
    id: 'DEL-2026-004',
    vendorId: 'VND-APEX-01',
    poNumber: 'PO-2026-062',
    skuId: 'SKU-MED-01',
    skuName: 'Emergency Cold-Chain Sensor Pack',
    depotId: 'depot-north',
    depotName: 'North Logistics Hub (Gurugram)',
    expectedDeliveryDate: '2026-11-05T00:00:00.000Z',
    actualDeliveryDate: null,
    expectedQuantity: 120,
    receivedQuantity: 0,
    unitPrice: 8900,
    baseAmount: 1068000,
    gstAmount: 192240,
    totalAmount: 1260240,
    status: 'DELAYED', // overdue past 05 Nov 2026
    lrNumber: 'LR-PUN-DEL-4491',
    ewayBillNumber: 'EWB-271088291001',
    vehicleNumber: 'MH-12-ZZ-3301',
    transporterName: 'VRL Bharat Freightways',
    notes: 'Production backlog at Chakan plant. Dispatched 04 Nov; currently delayed on NH 48.',
    createdAt: '2026-10-25T11:00:00.000Z'
  },

  // 2. Nordic Cold-Chain Systems (Chronic delays, partial intake, overdue shipment)
  {
    id: 'DEL-2026-005',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-039',
    skuId: 'SKU-IND-02',
    skuName: 'Industrial Temperature Relay',
    depotId: 'depot-south',
    depotName: 'South Distribution Center (Chennai)',
    expectedDeliveryDate: '2026-10-05T00:00:00.000Z',
    actualDeliveryDate: '2026-10-09T10:00:00.000Z',
    expectedQuantity: 200,
    receivedQuantity: 200,
    unitPrice: 2450,
    baseAmount: 490000,
    gstAmount: 88200,
    totalAmount: 578200,
    status: 'DELIVERED',
    lrNumber: 'LR-BOM-CHN-7719',
    ewayBillNumber: 'EWB-271029481902',
    vehicleNumber: 'MH-04-AX-5512',
    transporterName: 'Safexpress Northern Fleet',
    notes: 'Arrived 4 days late due to Nhava Sheva port customs clearance hold.',
    createdAt: '2026-09-28T14:00:00.000Z'
  },
  {
    id: 'DEL-2026-006',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-045',
    skuId: 'SKU-MED-01',
    skuName: 'Emergency Cold-Chain Sensor Pack',
    depotId: 'depot-north',
    depotName: 'North Logistics Hub (Gurugram)',
    expectedDeliveryDate: '2026-10-12T00:00:00.000Z',
    actualDeliveryDate: '2026-10-16T15:00:00.000Z',
    expectedQuantity: 150,
    receivedQuantity: 150,
    unitPrice: 8900,
    baseAmount: 1335000,
    gstAmount: 240300,
    totalAmount: 1575300,
    status: 'DELIVERED',
    lrNumber: 'LR-BOM-DEL-8820',
    ewayBillNumber: 'EWB-271038291047',
    vehicleNumber: 'MH-06-BQ-9918',
    transporterName: 'TCI Supply Chain Solutions',
    notes: 'Second consecutive late consignment (4 days late). Penalty warning issued.',
    createdAt: '2026-10-06T09:30:00.000Z'
  },
  {
    id: 'DEL-2026-007',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-052',
    skuId: 'SKU-IND-02',
    skuName: 'Industrial Temperature Relay',
    depotId: 'depot-east',
    depotName: 'East Gateway Depot (Kolkata)',
    expectedDeliveryDate: '2026-10-20T00:00:00.000Z',
    actualDeliveryDate: '2026-10-20T12:00:00.000Z',
    expectedQuantity: 120,
    receivedQuantity: 90,
    unitPrice: 2450,
    baseAmount: 294000,
    gstAmount: 52920,
    totalAmount: 346920,
    status: 'PARTIALLY_RECEIVED',
    lrNumber: 'LR-BOM-KOL-9102',
    ewayBillNumber: 'EWB-271067281912',
    vehicleNumber: 'WB-02-GH-4411',
    transporterName: 'GatiShakti Express Logistics',
    notes: 'Dock intake exception: 30 boxes water-damaged in transit and rejected. Partial intake.',
    createdAt: '2026-10-14T08:00:00.000Z'
  },
  {
    id: 'DEL-2026-008',
    vendorId: 'VND-NORDIC-02',
    poNumber: 'PO-2026-059',
    skuId: 'SKU-MED-01',
    skuName: 'Emergency Cold-Chain Sensor Pack',
    depotId: 'depot-south',
    depotName: 'South Distribution Center (Chennai)',
    expectedDeliveryDate: '2026-10-24T00:00:00.000Z',
    actualDeliveryDate: null,
    expectedQuantity: 100,
    receivedQuantity: 0,
    unitPrice: 8900,
    baseAmount: 890000,
    gstAmount: 160200,
    totalAmount: 1050200,
    status: 'DELAYED', // overdue past 24 Oct
    lrNumber: 'LR-BOM-CHN-9944',
    ewayBillNumber: 'EWB-271089201933',
    vehicleNumber: 'MH-04-KL-1209',
    transporterName: 'Safexpress Northern Fleet',
    notes: 'Shipment overdue by 16+ days! Supplier reported bonded warehouse customs audit.',
    createdAt: '2026-10-18T10:00:00.000Z'
  },

  // 3. BioGuard Protective Logistics (Mixed record, cancelled order)
  {
    id: 'DEL-2026-009',
    vendorId: 'VND-BIOGUARD-03',
    poNumber: 'PO-2026-044',
    skuId: 'SKU-MED-01',
    skuName: 'Emergency Cold-Chain Sensor Pack',
    depotId: 'depot-east',
    depotName: 'East Gateway Depot (Kolkata)',
    expectedDeliveryDate: '2026-10-14T00:00:00.000Z',
    actualDeliveryDate: '2026-10-14T09:00:00.000Z',
    expectedQuantity: 60,
    receivedQuantity: 60,
    unitPrice: 8900,
    baseAmount: 534000,
    gstAmount: 96120,
    totalAmount: 630120,
    status: 'DELIVERED',
    lrNumber: 'LR-AMD-KOL-5519',
    ewayBillNumber: 'EWB-241039481900',
    vehicleNumber: 'GJ-01-AB-1234',
    transporterName: 'VRL Bharat Freightways',
    notes: 'On-time delivery to East Gateway Depot dock. Compliance verified.',
    createdAt: '2026-10-09T08:00:00.000Z'
  },
  {
    id: 'DEL-2026-010',
    vendorId: 'VND-BIOGUARD-03',
    poNumber: 'PO-2026-050',
    skuId: 'SKU-IND-02',
    skuName: 'Industrial Temperature Relay',
    depotId: 'depot-north',
    depotName: 'North Logistics Hub (Gurugram)',
    expectedDeliveryDate: '2026-10-18T00:00:00.000Z',
    actualDeliveryDate: '2026-10-20T14:00:00.000Z',
    expectedQuantity: 80,
    receivedQuantity: 80,
    unitPrice: 2450,
    baseAmount: 196000,
    gstAmount: 35280,
    totalAmount: 231280,
    status: 'DELIVERED',
    lrNumber: 'LR-AMD-DEL-6621',
    ewayBillNumber: 'EWB-241059281944',
    vehicleNumber: 'GJ-27-TT-8840',
    transporterName: 'BlueDart Surface India',
    notes: 'Delayed 2 days due to heavy rainfall and Rajasthan highway re-routing.',
    createdAt: '2026-10-13T10:30:00.000Z'
  },
  {
    id: 'DEL-2026-011',
    vendorId: 'VND-BIOGUARD-03',
    poNumber: 'PO-2026-057',
    skuId: 'SKU-MED-01',
    skuName: 'Emergency Cold-Chain Sensor Pack',
    depotId: 'depot-south',
    depotName: 'South Distribution Center (Chennai)',
    expectedDeliveryDate: '2026-10-28T00:00:00.000Z',
    actualDeliveryDate: null,
    expectedQuantity: 50,
    receivedQuantity: 0,
    unitPrice: 8900,
    baseAmount: 445000,
    gstAmount: 80100,
    totalAmount: 525100,
    status: 'CANCELLED',
    lrNumber: 'LR-AMD-CHN-VOID',
    ewayBillNumber: 'EWB-CANCELLED',
    vehicleNumber: 'UNASSIGNED',
    transporterName: 'TCI Supply Chain Solutions',
    notes: 'Order cancelled before dispatch due to material spec revisions. Excluded from OTIF.',
    createdAt: '2026-10-22T13:00:00.000Z'
  }
];

export const INITIAL_TRANSFERS = [];

export const TRANSPORTERS = [
  { id: 'TR-VRL', name: 'VRL Bharat Freightways', rating: 4.6, fleetType: 'Multi-axle Heavy Container' },
  { id: 'TR-GATI', name: 'GatiShakti Express Logistics', rating: 4.7, fleetType: 'Reefer / Temp-Controlled 24ft' },
  { id: 'TR-TCI', name: 'TCI Supply Chain Solutions', rating: 4.5, fleetType: 'Dedicated Expressway Fleet' },
  { id: 'TR-BLUEDART', name: 'BlueDart Surface India', rating: 4.8, fleetType: 'Secure GPS-Monitored Parcel Fleet' },
  { id: 'TR-SAFEX', name: 'Safexpress Northern Fleet', rating: 4.4, fleetType: 'All-India Heavy Haulage' }
];

export const SAMPLE_VEHICLES = [
  'DL-01-CD-5678',
  'HR-55-XY-3021',
  'TN-09-EF-9988',
  'WB-02-GH-4411',
  'MH-12-PQ-7712',
  'GJ-01-AB-1234'
];

