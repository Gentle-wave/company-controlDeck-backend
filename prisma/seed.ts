import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();

  await prisma.$connect();

  console.log('🌱 Seeding database...');

  // ------------------------------------------------------------------
  // Users  (upsert — safe to re-run)
  // ------------------------------------------------------------------
  const passwordHashA = await bcrypt.hash('Password123!', 12);
  const passwordHashB = await bcrypt.hash('Password456!', 12);

  const userA = await prisma.user.upsert({
    where: { email: 'user_a@example.com' },
    update: {},
    create: {
      email: 'user_a@example.com',
      password: passwordHashA,
      role: UserRole.USER_A,
    },
  });
  console.log(`✅ USER_A ready: ${userA.email} (id: ${userA.id})`);

  const userB = await prisma.user.upsert({
    where: { email: 'user_b@example.com' },
    update: {},
    create: {
      email: 'user_b@example.com',
      password: passwordHashB,
      role: UserRole.USER_B,
    },
  });
  console.log(`✅ USER_B ready: ${userB.email} (id: ${userB.id})`);

  // ------------------------------------------------------------------
  // CompanyInput records  (skip if already present)
  // ------------------------------------------------------------------
  const companyNames = [
    { name: 'Acme Corp', users: 200, products: 50 },
    { name: 'Globex Inc', users: 400, products: 120 },
  ];

  for (const entry of companyNames) {
    const existing = await prisma.companyInput.findFirst({
      where: { ownerId: userA.id, companyName: entry.name },
    });
    if (existing) {
      console.log(`⏭️  CompanyInput already exists, skipping: ${entry.name}`);
      continue;
    }
    await prisma.companyInput.create({
      data: {
        ownerId: userA.id,
        companyName: entry.name,
        numberOfUsers: entry.users,
        numberOfProducts: entry.products,
        percentage: (entry.products / entry.users) * 100,
      },
    });
    console.log(`✅ CompanyInput created: ${entry.name}`);
  }

  // ------------------------------------------------------------------
  // ImageUpload records  (skip if already present)
  // ------------------------------------------------------------------
  const images = [
    { filename: 'profile-photo.jpg', mimetype: 'image/jpeg', size: 102400, storagePath: 'uploads/sample-profile-photo.jpg' },
    { filename: 'company-logo.png', mimetype: 'image/png', size: 51200, storagePath: 'uploads/sample-company-logo.png' },
  ];

  for (const img of images) {
    const existing = await prisma.imageUpload.findFirst({
      where: { ownerId: userA.id, filename: img.filename },
    });
    if (existing) {
      console.log(`⏭️  ImageUpload already exists, skipping: ${img.filename}`);
      continue;
    }
    await prisma.imageUpload.create({
      data: {
        ownerId: userA.id,
        uploaderId: userB.id,
        filename: img.filename,
        mimetype: img.mimetype,
        size: img.size,
        storagePath: img.storagePath,
      },
    });
    console.log(`✅ ImageUpload created: ${img.filename}`);
  }

  console.log('\n🎉 Seeding complete!');
  console.log('──────────────────────────────────────────');
  console.log('Credentials:');
  console.log(`  USER_A  →  email: user_a@example.com  |  password: Password123!`);
  console.log(`  USER_B  →  email: user_b@example.com  |  password: Password456!`);
  console.log('──────────────────────────────────────────');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
