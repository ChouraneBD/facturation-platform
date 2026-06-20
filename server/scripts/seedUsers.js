const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedDefaultUsers() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  await User.findOrCreate({
    where: { email: 'admin@test.com' },
    defaults: {
      nom: 'Admin TechPro',
      mot_de_passe: hashedPassword,
      role: 'admin'
    }
  });

  await User.findOrCreate({
    where: { email: 'client@test.com' },
    defaults: {
      nom: 'Client Dupont',
      mot_de_passe: hashedPassword,
      role: 'user'
    }
  });

  console.log('✅ Default users seeded (admin@test.com / client@test.com — password123).');
}

module.exports = { seedDefaultUsers };
