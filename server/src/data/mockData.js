// Synthetic data store for Multi-Depot Inventory Balancing (MVP 2A) - India Localization

export const initialDepots = [
  {
    id: 'depot-north',
    name: 'North Logistics Hub',
    city: 'Gurugram, Haryana (Delhi NCR)',
    region: 'North',
    gstin: '06AABCT9988C1Z4'
  },
  {
    id: 'depot-south',
    name: 'South Distribution Center',
    city: 'Chennai, Tamil Nadu',
    region: 'South',
    gstin: '33AABCS7766D1Z2'
  },
  {
    id: 'depot-east',
    name: 'East Gateway Depot',
    city: 'Kolkata, West Bengal',
    region: 'East',
    gstin: '19AABCE5544E1Z9'
  }
];

export const initialSkus = [
  {
    id: 'SKU-MED-01',
    name: 'Emergency Cold-Chain Sensor Pack',
    unit: 'boxes',
    unitCost: 8900.00
  },
  {
    id: 'SKU-IND-02',
    name: 'Industrial Temperature Relay',
    unit: 'units',
    unitCost: 2450.00
  }
];

export const initialInventory = [
  // SKU-MED-01: Deficit in North, Surplus in South, Balanced in East
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
  // SKU-IND-02: Surplus in North, Deficit in South, Balanced in East
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

export const initialTransfers = [];
