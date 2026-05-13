import { PrismaClient, ProductSource, UserRole } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GoPlayCommerce…');

  // Limpieza en orden de dependencias (DEV ONLY)
  await prisma.orderEvent.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.supplierOrder.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();

  // ─── Usuarios ─────────────────────────────────────────────
  const adminPass = await argon2.hash('admin123');
  const userPass  = await argon2.hash('user123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@goplayelectronic.fr',
      passwordHash: adminPass,
      firstName: 'Luis', lastName: 'Lora',
      role: UserRole.ADMIN, locale: 'fr',
      emailVerified: new Date(),
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'sophie.martin@example.com',
      passwordHash: userPass,
      firstName: 'Sophie', lastName: 'Martin',
      phone: '+33 6 12 34 56 78', locale: 'fr',
      emailVerified: new Date(), rgpdConsentAt: new Date(),
      addresses: {
        create: {
          fullName: 'Sophie Martin',
          line1: '12 Rue de la Paix', postalCode: '75001', city: 'Paris',
          country: 'FR', phone: '+33 6 12 34 56 78', isDefault: true,
        },
      },
    },
  });

  // ─── Categorías ───────────────────────────────────────────
  const audioCat = await prisma.category.create({
    data: { slug: 'audio', name: 'Audio & Casques', nameEn: 'Audio & Headphones', sortOrder: 1 },
  });
  const electCat = await prisma.category.create({
    data: { slug: 'electronique', name: 'Électronique', nameEn: 'Electronics', sortOrder: 2 },
  });
  const toolsCat = await prisma.category.create({
    data: { slug: 'outillage', name: 'Outillage', nameEn: 'Tools', sortOrder: 3 },
  });

  // ─── Suppliers ────────────────────────────────────────────
  const aliSupplier = await prisma.supplier.create({
    data: { name: 'AliExpress', source: ProductSource.ALIEXPRESS, contactEmail: 'support@aliexpress.com' },
  });
  const cjSupplier = await prisma.supplier.create({
    data: { name: 'CJDropshipping', source: ProductSource.CJDROPSHIPPING, contactEmail: 'support@cjdropshipping.com' },
  });

  // ─── Productos reales (GoPlayElectronic inventory) ────────
  const products = [
    {
      slug: 'philips-powerbank-20000mah-md2549',
      sku: 'PHI-001',
      name: 'Philips Powerbank 20.000mAh MD2549',
      nameEn: 'Philips Power Bank 20,000mAh MD2549',
      description: 'Batterie externe Philips 20 000 mAh, charge rapide 22.5W, 2 ports USB-A + 1 USB-C. Idéale pour smartphone, tablette et ordinateur portable.',
      brand: 'Philips',
      categoryId: electCat.id,
      costCents: 1900, priceCents: 4000, compareAtCents: 5500,
      stock: 2, weightGrams: 460,
      source: ProductSource.MANUAL,
      images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800'],
    },
    {
      slug: 'freshn-rebel-tws-hybrid-anc',
      sku: 'FNR-001',
      name: "Fresh'n Rebel TWS Hybrid ANC",
      nameEn: "Fresh'n Rebel TWS Hybrid ANC",
      description: "Écouteurs sans fil Fresh'n Rebel avec réduction active du bruit (ANC), Bluetooth 5.2, autonomie 24h avec étui de charge.",
      brand: "Fresh'n Rebel",
      categoryId: audioCat.id,
      costCents: 2000, priceCents: 4600, compareAtCents: 6900,
      stock: 2, weightGrams: 80,
      source: ProductSource.ALIEXPRESS, supplierId: aliSupplier.id,
      externalId: 'ali-1005006789',
      images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800'],
    },
    {
      slug: 'freshn-rebel-tws-sport',
      sku: 'FNR-002',
      name: "Fresh'n Rebel TWS Sport",
      description: "Écouteurs sport sans fil, IPX5, fixation auriculaire ergonomique, parfait pour la course et le fitness.",
      brand: "Fresh'n Rebel",
      categoryId: audioCat.id,
      costCents: 1300, priceCents: 3400, compareAtCents: 4900,
      stock: 2, weightGrams: 60,
      source: ProductSource.ALIEXPRESS, supplierId: aliSupplier.id,
      images: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800'],
    },
    {
      slug: 'varo-precision-screwdriver-26pc',
      sku: 'VAR-001',
      name: 'Varo Precision Screwdriver Set 26pc',
      description: 'Jeu de tournevis de précision 26 pièces Varo, idéal pour réparation smartphones, lunettes, électronique.',
      brand: 'Varo',
      categoryId: toolsCat.id,
      costCents: 1400, priceCents: 2600, compareAtCents: 3500,
      stock: 1, weightGrams: 280,
      source: ProductSource.CJDROPSHIPPING, supplierId: cjSupplier.id,
      externalId: 'cj-2024005678',
      images: ['https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800'],
    },
  ];

  for (const p of products) {
    const { images, ...data } = p;
    await prisma.product.create({
      data: {
        ...data,
        publishedAt: new Date(),
        images: { create: images.map((url, i) => ({ url, sortOrder: i, alt: data.name })) },
      },
    });
  }

  // ─── Cupón de bienvenida ──────────────────────────────────
  await prisma.coupon.create({
    data: {
      code: 'BIENVENUE10',
      type: 'PERCENT',
      valueCents: 10, // 10%
      minAmountCents: 3000,
      maxUses: 100,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.coupon.create({
    data: {
      code: 'LIVRAISON',
      type: 'FIXED',
      valueCents: 500, // -5€
      minAmountCents: 5000,
      maxUses: 200,
    },
  });

  console.log('✅ Seed terminé');
  console.log(`👤 Admin: admin@goplayelectronic.fr / admin123`);
  console.log(`👤 Client: sophie.martin@example.com / user123`);
  console.log(`🎟️  Coupons: BIENVENUE10 (-10%) · LIVRAISON (-5€)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
