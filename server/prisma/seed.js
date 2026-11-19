import { PrismaClient } from '@prisma/client';
import { initialDepots, initialSkus, initialInventory } from '../src/data/mockData.js';
import { initialVendors, initialVendorDeliveries } from '../src/data/mockVendorData.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

export async function seed(client = prisma) {
  console.log('🌱 Starting Nexus PostgreSQL database seed...');

  // 1. Clean existing records in reverse dependency order
  await client.transfer.deleteMany();
  await client.inventoryLevel.deleteMany();
  await client.sku.deleteMany();
  await client.depot.deleteMany();

  // 2. Seed Depots
  console.log(`Seeding ${initialDepots.length} regional depots...`);
  for (const depot of initialDepots) {
    await client.depot.create({
      data: {
        id: depot.id,
        name: depot.name,
        city: depot.city,
        region: depot.region
      }
    });
  }

  // 3. Seed SKUs
  console.log(`Seeding ${initialSkus.length} critical SKUs...`);
  for (const sku of initialSkus) {
    await client.sku.create({
      data: {
        id: sku.id,
        name: sku.name,
        unit: sku.unit,
        unitCost: sku.unitCost
      }
    });
  }

  // 4. Seed Inventory Levels
  console.log(`Seeding ${initialInventory.length} depot inventory records...`);
  for (const inv of initialInventory) {
    await client.inventoryLevel.create({
      data: {
        depotId: inv.depotId,
        skuId: inv.skuId,
        onHand: inv.onHand,
        reserved: inv.reserved ?? 0,
        inTransit: inv.inTransit ?? 0,
        safetyStock: inv.safetyStock,
        targetStock: inv.targetStock
      }
    });
  }

  // 5. Seed Vendors
  console.log(`Seeding ${initialVendors.length} registered vendors...`);
  await client.vendorDelivery.deleteMany();
  await client.vendor.deleteMany();
  for (const vendor of initialVendors) {
    await client.vendor.create({
      data: {
        id: vendor.id,
        name: vendor.name,
        category: vendor.category,
        contactEmail: vendor.contactEmail,
        leadTimeDays: vendor.leadTimeDays,
        targetOtifRate: vendor.targetOtifRate,
        isActive: vendor.isActive
      }
    });
  }

  // 6. Seed Vendor Deliveries
  console.log(`Seeding ${initialVendorDeliveries.length} vendor deliveries...`);
  for (const del of initialVendorDeliveries) {
    await client.vendorDelivery.create({
      data: {
        id: del.id,
        vendorId: del.vendorId,
        skuId: del.skuId,
        depotId: del.depotId,
        poNumber: del.poNumber,
        expectedDeliveryDate: new Date(del.expectedDeliveryDate),
        actualDeliveryDate: del.actualDeliveryDate ? new Date(del.actualDeliveryDate) : null,
        expectedQuantity: del.expectedQuantity,
        receivedQuantity: del.receivedQuantity ?? 0,
        status: del.status,
        notes: del.notes
      }
    });
  }

  console.log('✅ Nexus database successfully seeded with synthetic baseline data.');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seed()
    .catch((e) => {
      console.error('❌ Database seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
