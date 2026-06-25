import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Care Manager — Ravi
  const ravi = await prisma.user.create({
    data: { name: 'Ravi Kumar', phone: '+919900000001', role: 'care_manager', passwordHash, locale: 'en' },
  });

  // Caregiver — Ramesh
  const rameshUser = await prisma.user.create({
    data: { name: 'Ramesh Naik', phone: '+919900000002', role: 'caregiver', passwordHash, locale: 'kn' },
  });
  const ramesh = await prisma.caregiver.create({
    data: {
      userId: rameshUser.id,
      verificationStatus: 'verified',
      skillsJson: JSON.stringify(['attendant', 'physio']),
      serviceCitiesJson: JSON.stringify(['Hubli']),
      rating: 4.8,
    },
  });

  // Buyer — Anjali (NRI daughter, Seattle)
  const anjali = await prisma.user.create({
    data: { name: 'Anjali Rao', phone: '+12065550100', role: 'buyer', passwordHash, locale: 'en', timezone: 'America/Los_Angeles' },
  });

  const family = await prisma.family.create({
    data: { primaryBuyerId: anjali.id, billingCurrency: 'USD' },
  });
  await prisma.user.update({ where: { id: anjali.id }, data: { familyId: family.id } });

  // Parent — Lakshmi (Hubli)
  const lakshmiUser = await prisma.user.create({
    data: { name: 'Lakshmi Rao', phone: '+919900000003', role: 'parent', passwordHash, locale: 'kn', familyId: family.id },
  });
  const lakshmi = await prisma.parent.create({
    data: {
      userId: lakshmiUser.id,
      familyId: family.id,
      dob: new Date('1954-03-12'),
      address: '12 Vidyanagar, Hubli, Karnataka',
      geoLat: 15.3647,
      geoLng: 75.124,
      languagesJson: JSON.stringify(['kn', 'en']),
      mobilityLevel: 'limited',
      techComfort: 'low',
      conditionsJson: JSON.stringify(['hypertension']),
      emergencyContactsJson: JSON.stringify([{ name: 'Anjali Rao', phone: '+12065550100' }]),
      preferredHospital: 'KIMS Hubli',
    },
  });

  await prisma.carePlan.create({
    data: { familyId: family.id, tier: 'premium_nri', recurringServicesJson: JSON.stringify(['attendant', 'physio']), careManagerId: ravi.id },
  });

  // A scheduled visit ready to be checked into via the caregiver flow
  await prisma.visit.create({
    data: {
      parentId: lakshmi.id,
      caregiverId: rameshUser.id,
      scheduledById: ravi.id,
      type: 'attendant',
      scheduledAt: new Date(),
      taskChecklistJson: JSON.stringify([
        { task: 'Check BP', done: false },
        { task: 'Assist with medication', done: false },
        { task: 'Physio exercises', done: false },
      ]),
      status: 'scheduled',
    },
  });

  console.log('Seeded demo data:');
  console.log('  Buyer (Anjali):       +12065550100 / password123');
  console.log('  Parent (Lakshmi):     +919900000003 / password123');
  console.log('  Care Manager (Ravi):  +919900000001 / password123');
  console.log('  Caregiver (Ramesh):   +919900000002 / password123');
  console.log(`  familyId: ${family.id}`);
  console.log(`  parentId: ${lakshmi.id}`);
  console.log(`  caregiverUserId: ${rameshUser.id}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
