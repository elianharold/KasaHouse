/**
 * Development seed — a few landlords with published listings so the mobile
 * browse/search screens have real data on first run.
 * Run with: pnpm --filter @kasahouse/backend db:seed
 */
import { PrismaClient, type Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const GHS = (cedis: number): number => Math.round(cedis * 100);

async function main(): Promise<void> {
  const landlordA = await prisma.user.upsert({
    where: { phone: '+233201110001' },
    update: {},
    create: {
      phone: '+233201110001',
      fullName: 'Ama Boateng',
      roles: ['LANDLORD'],
      kycStatus: 'UNVERIFIED',
    },
  });

  const landlordB = await prisma.user.upsert({
    where: { phone: '+233201110002' },
    update: {},
    create: {
      phone: '+233201110002',
      fullName: 'Kwame Mensah',
      roles: ['LANDLORD', 'TENANT'],
      kycStatus: 'VERIFIED',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+233201110003' },
    update: {},
    create: {
      phone: '+233201110003',
      fullName: 'Efua Sarpong',
      roles: ['TENANT'],
      kycStatus: 'PENDING',
    },
  });

  const listings: Array<Prisma.ListingCreateInput> = [
    {
      owner: { connect: { id: landlordA.id } },
      purpose: 'RENT',
      propertyType: 'CHAMBER_AND_HALL',
      title: 'Chamber & hall self-contained at East Legon',
      description:
        'Newly built chamber and hall self-contained in a gated compound. Tiled floors, ceiling fans, prepaid meter, 24/7 water with a polytank. Walking distance to the American House traffic light.',
      price: GHS(1800),
      rentPeriod: 'MONTH',
      advanceMonths: 12,
      bedrooms: 1,
      bathrooms: 1,
      region: 'Greater Accra',
      city: 'Accra',
      area: 'East Legon',
      landmark: 'Near American House',
      requirements: ['Working professional or NSS', 'No pets', '1 year advance'],
      addOns: [
        { label: 'Fitted kitchen cabinets', price: null },
        { label: 'Reserved parking slot', price: GHS(100) },
      ] as Prisma.InputJsonValue,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      owner: { connect: { id: landlordA.id } },
      purpose: 'RENT',
      propertyType: 'APARTMENT',
      title: '2-bedroom apartment, Spintex Road',
      description:
        'Spacious 2-bedroom apartment on the first floor of a 4-unit block. Large windows, fitted wardrobes, kitchen with hood and hob, borehole plus GWCL. Secure with a gateman.',
      price: GHS(3500),
      rentPeriod: 'MONTH',
      advanceMonths: 12,
      bedrooms: 2,
      bathrooms: 2,
      region: 'Greater Accra',
      city: 'Accra',
      area: 'Spintex',
      landmark: 'Off Spintex Road, near Coca-Cola',
      requirements: ['2 years advance negotiable', 'Family or couple preferred'],
      addOns: [{ label: 'Air conditioner in master bedroom', price: null }] as Prisma.InputJsonValue,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      owner: { connect: { id: landlordB.id } },
      purpose: 'SALE',
      propertyType: 'HOUSE',
      title: '4-bedroom house with boys quarters, Kumasi',
      description:
        'Detached 4-bedroom house on a walled 80x100 plot at Ahodwo. All rooms en-suite, large living and dining area, separate 2-room boys quarters, borehole, and space for 3 cars. Indenture and building permit available.',
      price: GHS(1850000),
      rentPeriod: null,
      advanceMonths: null,
      bedrooms: 4,
      bathrooms: 5,
      region: 'Ashanti',
      city: 'Kumasi',
      area: 'Ahodwo',
      landmark: 'Near Golden Tulip',
      requirements: ['Proof of funds', 'Lawyer-to-lawyer documentation'],
      addOns: [{ label: 'Fitted wardrobes throughout', price: null }] as Prisma.InputJsonValue,
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
    {
      owner: { connect: { id: landlordB.id } },
      purpose: 'RENT',
      propertyType: 'SINGLE_ROOM',
      title: 'Single room self-contained, Tema Community 25',
      description:
        'Single room self-contained in a quiet area of Community 25. Prepaid meter, tiled, own bathroom and kitchenette. Trotro and taxi access at the junction.',
      price: GHS(700),
      rentPeriod: 'MONTH',
      advanceMonths: 6,
      bedrooms: 1,
      bathrooms: 1,
      region: 'Greater Accra',
      city: 'Tema',
      area: 'Community 25',
      requirements: ['6 months advance', 'Quiet tenant'],
      addOns: [] as Prisma.InputJsonValue,
      status: 'DRAFT',
    },
  ];

  for (const data of listings) {
    const existing = await prisma.listing.findFirst({
      where: { title: data.title },
    });
    if (!existing) {
      await prisma.listing.create({ data });
    }
  }

  const count = await prisma.listing.count();
  console.log(`Seed complete. ${count} listings in the database.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
