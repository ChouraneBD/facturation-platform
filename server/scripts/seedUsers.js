const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedDefaultUsers() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  await User.findOneAndUpdate(
    { email: 'admin@test.com' },
    {
      nom: 'Admin TechPro',
      email: 'admin@test.com',
      mot_de_passe: hashedPassword,
      role: 'admin'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'client@test.com' },
    {
      nom: 'Client Dupont',
      email: 'client@test.com',
      mot_de_passe: hashedPassword,
      role: 'user'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('✅ Default users seeded (admin@test.com / client@test.com — password123).');
}

module.exports = { seedDefaultUsers };
