const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with comprehensive sample data...');

  // Create admin user
  const adminSalt = CryptoJS.lib.WordArray.random(32).toString();
  const adminPassword = bcrypt.hashSync('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fds.be' },
    update: {},
    create: {
      email: 'admin@fds.be',
      name: 'Admin',
      password: adminPassword,
      salt: adminSalt,
      type: 1, // admin
      phone: '+32412345678'
    }
  });

  console.log('Created admin user:', admin.email);

  // Create regular users
  const clientSalt = CryptoJS.lib.WordArray.random(32).toString();
  const clientPassword = bcrypt.hashSync('password123', 10);

  const client = await prisma.user.upsert({
    where: { email: 'client@fds.be' },
    update: {},
    create: {
      email: 'client@fds.be',
      name: 'Client Test',
      password: clientPassword,
      salt: clientSalt,
      type: 0,
      phone: '+32412345679'
    }
  });

  console.log('Created client user:', client.email);

  // Create tags
  const tags = await Promise.all([
    prisma.tags.create({
      data: { nom: 'Végétarien', description: 'Plats végétariens', emoji: '🥕', recherchable: true }
    }),
    prisma.tags.create({
      data: { nom: 'Épicé', description: 'Plats épicés', emoji: '🌶️', recherchable: true }
    }),
    prisma.tags.create({
      data: { nom: 'Halal', description: 'Plats halal', emoji: '☪️', recherchable: true }
    }),
    prisma.tags.create({
      data: { nom: 'Nouveau', description: 'Nouveaux plats', emoji: '✨', recherchable: false }
    })
  ]);

  console.log('Created tags');

  // Create sauces
  const sauces = await Promise.all([
    prisma.sauce.upsert({
      where: { name: 'Sauce Algérienne' },
      update: {},
      create: {
        name: 'Sauce Algérienne',
        description: 'Sauce traditionnelle algérienne',
        price: 1.50,
        available: true,
        ordre: '1'
      }
    }),
    prisma.sauce.upsert({
      where: { name: 'Sauce Harissa' },
      update: {},
      create: { name: 'Sauce Harissa', description: 'Sauce piquante à la harissa', price: 1.00, available: true, ordre: '2' }
    }),
    prisma.sauce.upsert({
      where: { name: 'Sauce Blanche' },
      update: {},
      create: {
        name: 'Sauce Blanche',
        description: 'Sauce blanche crémeuse',
        price: 1.20,
        available: true,
        ordre: '3'
      }
    })
  ]);

  console.log('Created sauces');

  // Create extras
  const extras = await Promise.all([
    prisma.extra.create({
      data: {
        nom: 'Frites',
        description: 'Frites croustillantes',
        price: 2.50,
        available: true,
        availableForDelivery: true,
        speciality: false
      }
    }),
    prisma.extra.create({
      data: {
        nom: 'Fromage',
        description: 'Supplément fromage',
        price: 1.00,
        available: true,
        availableForDelivery: true,
        speciality: false
      }
    }),
    prisma.extra.create({
      data: {
        nom: 'Viande Supplémentaire',
        description: 'Portion de viande supplémentaire',
        price: 3.00,
        available: true,
        availableForDelivery: true,
        speciality: false
      }
    })
  ]);

  console.log('Created extras');

  // Create ingredients
  const ingredients = await Promise.all([
    prisma.ingredient.create({
      data: { name: 'Tomate', description: 'Tomates fraîches' }
    }),
    prisma.ingredient.create({
      data: { name: 'Oignon', description: 'Oignons frais' }
    }),
    prisma.ingredient.create({
      data: { name: 'Poivron', description: 'Poivrons colorés' }
    }),
    prisma.ingredient.create({
      data: { name: 'Viande Hachée', description: 'Viande hachée de qualité' }
    }),
    prisma.ingredient.create({
      data: { name: 'Fromage', description: 'Fromage râpé' }
    })
  ]);

  console.log('Created ingredients');

  // Create plats
  const plats = await Promise.all([
    prisma.plat.upsert({
      where: { name: 'Tacos Viande' },
      update: {},
      create: {
        name: 'Tacos Viande',
        description: 'Délicieux tacos à la viande hachée',
        price: 8.50,
        ordre: '1',
        available: true,
        availableForDelivery: true,
        speciality: false,
        IncludesSauce: true,
        saucePrice: 1.50,
        versions: {
          create: [
            { size: 'M', extraPrice: 0.0 },
            { size: 'L', extraPrice: 2.0 }
          ]
        },
        ingredients: {
          create: [
            { ingredientId: ingredients[0].id, removable: true },
            { ingredientId: ingredients[1].id, removable: true },
            { ingredientId: ingredients[3].id, removable: false }
          ]
        }
      }
    }),
    prisma.plat.upsert({
      where: { name: 'Tacos Végétarien' },
      update: {},
      create: {
        name: 'Tacos Végétarien',
        description: 'Tacos végétarien aux légumes',
        price: 7.50,
        ordre: '2',
        available: true,
        availableForDelivery: true,
        speciality: false,
        IncludesSauce: true,
        saucePrice: 1.50,
        tags: {
          connect: [{ id: tags[0].id }] // Végétarien
        },
        versions: {
          create: [
            { size: 'M', extraPrice: 0.0 },
            { size: 'L', extraPrice: 1.50 }
          ]
        },
        ingredients: {
          create: [
            { ingredientId: ingredients[0].id, removable: true },
            { ingredientId: ingredients[2].id, removable: true },
            { ingredientId: ingredients[4].id, removable: false }
          ]
        }
      }
    }),
    prisma.plat.upsert({
      where: { name: 'Tacos Épicés' },
      update: {},
      create: {
        name: 'Tacos Épicés',
        description: 'Tacos très épicés pour les amateurs de sensations fortes',
        price: 9.00,
        ordre: '3',
        available: true,
        availableForDelivery: true,
        speciality: true,
        IncludesSauce: true,
        saucePrice: 1.50,
        tags: {
          connect: [{ id: tags[1].id }] // Épicé
        },
        versions: {
          create: [
            { size: 'M', extraPrice: 0.0 },
            { size: 'L', extraPrice: 2.50 }
          ]
        },
        ingredients: {
          create: [
            { ingredientId: ingredients[0].id, removable: true },
            { ingredientId: ingredients[1].id, removable: true },
            { ingredientId: ingredients[3].id, removable: false }
          ]
        }
      }
    })
  ]);

  console.log('Created plats');

  // Create sample orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        userId: client.id,
        totalPrice: 10.00,
        status: 5, // Delivered
        OrderType: 'delivery',
        items: {
          create: [
            {
              platId: plats[0].id,
              quantity: 1,
              unitPrice: 8.50,
              totalPrice: 8.50,
              versionSize: 'M',
              sauceId: sauces[0].id
            }
          ]
        }
      }
    }),
    prisma.order.create({
      data: {
        userId: client.id,
        totalPrice: 9.50,
        status: 6, // Finished
        OrderType: 'takeout',
        items: {
          create: [
            {
              platId: plats[1].id,
              quantity: 1,
              unitPrice: 7.50,
              totalPrice: 7.50,
              versionSize: 'M',
              sauceId: sauces[1].id
            }
          ]
        }
      }
    })
  ]);

  console.log('Created sample orders');

  // Create settings
  const settings = await Promise.all([
    prisma.settings.upsert({
      where: { key: 'restaurant_name' },
      update: {},
      create: {
        key: 'restaurant_name',
        value: 'FDS Restaurant',
        type: 'string',
        description: 'Nom du restaurant',
        category: 'general'
      }
    }),
    prisma.settings.upsert({
      where: { key: 'delivery_fee' },
      update: {},
      create: {
        key: 'delivery_fee',
        value: '2.50',
        type: 'number',
        description: 'Frais de livraison',
        category: 'orders'
      }
    })
  ]);

  console.log('Created settings');

  // Create restaurant config
  const config = await prisma.restaurantConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      openMode: 'auto',
      openDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
      openStart: '11:00',
      openEnd: '22:00',
      manualOpen: true
    }
  });

  console.log('Created restaurant config');

  console.log('Database seeded successfully with comprehensive sample data!');
  console.log('Summary:');
  console.log('- Users: 2 (1 admin, 1 client)');
  console.log('- Tags: 4');
  console.log('- Sauces: 3');
  console.log('- Extras: 3');
  console.log('- Ingredients: 5');
  console.log('- Plats: 3');
  console.log('- Orders: 2');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });