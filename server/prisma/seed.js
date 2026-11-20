import { PrismaClient } from '@prisma/client';
import { initialDepots, initialSkus, initialInventory } from '../src/data/mockData.js';
import { initialVendors, initialVendorDeliveries } from '../src/data/mockVendorData.js';
import { hashPassword } from '../src/utils/crypto.js';
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

  // 7. Seed System Staff & Administrative Users
  console.log('Seeding baseline authorized staff accounts...');
  await client.user.deleteMany();
  const demoPasswordHash = await hashPassword('Nexus@2026');

  const baselineUsers = [
    {
      email: 'scm@nexus-demo.com',
      name: 'Priya Nair',
      role: 'HEAD_OF_SUPPLY_CHAIN',
      depotId: null
    },
    {
      email: 'north@nexus-demo.com',
      name: 'Rohit Chauhan',
      role: 'DEPOT_MANAGER',
      depotId: 'depot-north'
    },
    {
      email: 'south@nexus-demo.com',
      name: 'Meera Krishnan',
      role: 'DEPOT_MANAGER',
      depotId: 'depot-south'
    },
    {
      email: 'east@nexus-demo.com',
      name: 'Amit Banerjee',
      role: 'DEPOT_MANAGER',
      depotId: 'depot-east'
    },
    {
      email: 'procurement@nexus-demo.com',
      name: 'Sunita Rao',
      role: 'PROCUREMENT_MANAGER',
      depotId: null
    },
    {
      email: 'admin@nexus-demo.com',
      name: 'Nexus System Administrator',
      role: 'ADMIN',
      depotId: null
    }
  ];

  for (const u of baselineUsers) {
    await client.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        depotId: u.depotId,
        passwordHash: demoPasswordHash
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
