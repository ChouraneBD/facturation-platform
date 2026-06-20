require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');

async function seedDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const hashedPassword = await bcrypt.hash('password123', 10);

    await User.findOrCreate({
      where: { email: 'admin@test.com' },
      defaults: {
        nom: 'Admin TechPro',
        mot_de_passe: hashedPassword,
        role: 'admin'
      }
    });
    console.log('👤 Admin user ensured: admin@test.com');

    await User.findOrCreate({
      where: { email: 'client@test.com' },
      defaults: {
        nom: 'Client Dupont',
        mot_de_passe: hashedPassword,
        role: 'user'
      }
    });
    console.log('👤 Client user ensured: client@test.com');

    console.log('✨ PostgreSQL seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
