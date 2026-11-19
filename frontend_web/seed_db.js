import mongoose from '../Bus_Reservation/node_modules/mongoose/index.js';
import bcrypt from '../Bus_Reservation/node_modules/bcrypt/bcrypt.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/nest';

const PREDEFINED_BUS_MODELS = [
  {
    title: 'First Class (Large)',
    category: 'first_class',
    size: 'large',
    capacity: 30,
    layoutDetails: { rows: 10, seatsPerRow: 3, type: 'first_class_large', seatingPattern: '1 + 2' },
    totalBusesCount: 5,
  },
  {
    title: 'First Class (Medium)',
    category: 'first_class',
    size: 'medium',
    capacity: 20,
    layoutDetails: { rows: 10, seatsPerRow: 2, type: 'first_class_medium', seatingPattern: '1 + 1' },
    totalBusesCount: 5,
  },
  {
    title: 'Business Class (Large)',
    category: 'business_class',
    size: 'large',
    capacity: 40,
    layoutDetails: { rows: 10, seatsPerRow: 4, type: 'business_class_large', seatingPattern: '2 + 2' },
    totalBusesCount: 10,
  },
  {
    title: 'Business Class (Medium)',
    category: 'business_class',
    size: 'medium',
    capacity: 30,
    layoutDetails: { rows: 10, seatsPerRow: 3, type: 'business_class_medium', seatingPattern: '1 + 2' },
    totalBusesCount: 10,
  },
  {
    title: 'Economy Class (Large)',
    category: 'economy_class',
    size: 'large',
    capacity: 50,
    layoutDetails: { rows: 10, seatsPerRow: 5, type: 'economy_class_large', seatingPattern: '2 + 3' },
    totalBusesCount: 15,
  },
  {
    title: 'Economy Class (Medium)',
    category: 'economy_class',
    size: 'medium',
    capacity: 40,
    layoutDetails: { rows: 10, seatsPerRow: 4, type: 'economy_class_medium', seatingPattern: '2 + 2' },
    totalBusesCount: 15,
  },
];

async function seed() {
  console.log('Connecting to MongoDB at', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Seed Users
  const usersCollection = db.collection('users');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const initialUsers = [
    {
      name: 'أحمد الخطيب',
      username: 'ahmad_admin',
      phone: '0944211009',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'سارة محمود',
      username: 'sara_sec',
      phone: '0910522105',
      password: hashedPassword,
      role: 'secretary',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'محمد العلي',
      username: 'mohamed_ali',
      phone: '0972100444',
      password: hashedPassword,
      role: 'customer',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'ليان أحمد',
      username: 'layan_cust',
      phone: '0993500333',
      password: hashedPassword,
      role: 'customer',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'نور عثمان',
      username: 'nour_othman',
      phone: '0966000222',
      password: hashedPassword,
      role: 'customer',
      status: 'suspended',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'رامي يوسف',
      username: 'rami_youssef',
      phone: '0972100888',
      password: hashedPassword,
      role: 'customer',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const u of initialUsers) {
    await usersCollection.updateOne(
      { username: u.username },
      { $set: u },
      { upsert: true }
    );
  }
  console.log('Seeded users successfully.');

  // 2. Seed Bus Models
  const busCollection = db.collection('busmodels');
  const savedBuses = [];
  for (const b of PREDEFINED_BUS_MODELS) {
    const res = await busCollection.findOneAndUpdate(
      { category: b.category, size: b.size },
      { $set: { ...b, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    savedBuses.push(res);
  }
  console.log(`Seeded ${savedBuses.length} bus models.`);

  // 3. Seed Trips
  const tripCollection = db.collection('trips');
  const todayStr = new Date().toISOString().slice(0, 10);
  const bus1 = savedBuses[2] || (await busCollection.findOne({ category: 'business_class', size: 'large' })) || (await busCollection.findOne());
  const bus2 = savedBuses[2] || (await busCollection.findOne({ category: 'business_class', size: 'large' })) || (await busCollection.findOne());

  const initialTrips = [
    {
      source: 'دمشق',
      destination: 'حلب',
      busModelId: bus1._id,
      price: 95000,
      tripDate: todayStr,
      tripTime: '08:30',
      scheduleType: 'daily',
      status: 'scheduled',
      bookedSeatsCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      source: 'دمشق',
      destination: 'حلب',
      busModelId: bus2._id,
      price: 80000,
      tripDate: todayStr,
      tripTime: '14:00',
      scheduleType: 'daily',
      status: 'scheduled',
      bookedSeatsCount: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      source: 'دمشق',
      destination: 'حمص',
      busModelId: bus1._id,
      price: 45000,
      tripDate: todayStr,
      tripTime: '17:30',
      scheduleType: 'weekly',
      status: 'scheduled',
      bookedSeatsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      source: 'حلب',
      destination: 'اللاذقية',
      busModelId: bus2._id,
      price: 70000,
      tripDate: todayStr,
      tripTime: '09:00',
      scheduleType: 'daily',
      status: 'scheduled',
      bookedSeatsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const createdTrips = [];
  for (const t of initialTrips) {
    const existing = await tripCollection.findOne({
      source: t.source,
      destination: t.destination,
      tripDate: t.tripDate,
      tripTime: t.tripTime,
    });
    if (!existing) {
      const res = await tripCollection.insertOne(t);
      createdTrips.push({ _id: res.insertedId, ...t });
    } else {
      await tripCollection.updateOne({ _id: existing._id }, { $set: { busModelId: bus1._id } });
      createdTrips.push({ ...existing, busModelId: bus1._id });
    }
  }
  // Ensure all trips in DB have capacity >= 32
  await tripCollection.updateMany({}, { $set: { busModelId: bus1._id } });
  console.log(`Seeded ${createdTrips.length} trips.`);

  // 4. Seed Bookings
  const bookingCollection = db.collection('bookings');
  const cust1 = await usersCollection.findOne({ username: 'mohamed_ali' });
  const cust2 = await usersCollection.findOne({ username: 'layan_cust' });

  if (createdTrips.length > 0 && cust1 && cust2) {
    const trip0 = createdTrips[0];
    const trip1 = createdTrips[1];

    // Check if bookings already exist for trip0
    const count = await bookingCollection.countDocuments({ tripId: trip0._id });
    if (count === 0) {
      await bookingCollection.insertMany([
        {
          customerId: cust1._id,
          tripId: [trip0._id, trip0._id.toString()],
          seatNumbers: [2, 3],
          status: 'confirmed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: cust2._id,
          tripId: [trip0._id, trip0._id.toString()],
          seatNumbers: [7],
          status: 'reserved',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          customerId: cust1._id,
          tripId: [trip1._id, trip1._id.toString()],
          seatNumbers: [5, 6],
          status: 'reserved',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      console.log('Seeded sample bookings for trips.');
    }
  }

  await mongoose.disconnect();
  console.log('Database seeding finished successfully!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

