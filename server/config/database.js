const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/facturation';

async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connection established successfully.');
}

module.exports = connectDatabase;
