// Synthetic data store for Multi-Depot Inventory Balancing (MVP 2A)

export const initialDepots = [
  {
    id: 'depot-north',
    name: 'North Logistics Hub',
    city: 'Chicago, IL',
    region: 'Midwest'
  },
  {
    id: 'depot-south',
    name: 'South Distribution Center',
    city: 'Dallas, TX',
    region: 'South'
  },
  {
    id: 'depot-east',
    name: 'East Gateway Depot',
    city: 'Philadelphia, PA',
    region: 'East'
  }
];

export const initialSkus = [
  {
    id: 'SKU-MED-01',
    name: 'Emergency Cold-Chain Sensor Pack',
    unit: 'boxes',
    unitCost: 145.00
  },
  {
    id: 'SKU-IND-02',
    name: 'Industrial Temperature Relay',
    unit: 'units',
    unitCost: 82.50
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
