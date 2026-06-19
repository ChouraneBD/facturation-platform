require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDatabase = require('../config/database');
const User = require('../models/User');

async function seedDatabase() {
  try {
    await connectDatabase();

    const hashedPassword = await bcrypt.hash('password123', 10);

    await User.findOneAndUpdate(
      { email: 'admin@test.com' },
      {
        nom: 'Admin TechPro',
        mot_de_passe: hashedPassword,
        role: 'admin'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('👤 Admin user ensured: admin@test.com');

    await User.findOneAndUpdate(
      { email: 'client@test.com' },
      {
        nom: 'Client Dupont',
        mot_de_passe: hashedPassword,
        role: 'user'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('👤 Client user ensured: client@test.com');

    console.log('✨ MongoDB seeding complete. Articles/catégories: json-server/db.json');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
