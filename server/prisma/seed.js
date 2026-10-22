import { PrismaClient } from '@prisma/client';
import { initialDepots, initialSkus, initialInventory } from '../src/data/mockData.js';
import dotenv from 'dotenv';

dotenv.config();

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
        safetyStock: inv.safetyStock,
        targetStock: inv.targetStock
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
