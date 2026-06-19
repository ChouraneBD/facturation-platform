const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDatabase = require('./config/database');
const { initFirebaseAdmin } = require('./config/firebase');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const factureRoutes = require('./routes/factureRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { warmUpEmailTransport } = require('./services/emailService');
const { sendContactMessage } = require('./controllers/contactController');
const { seedDefaultUsers } = require('./scripts/seedUsers');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.post('/api/contact', sendContactMessage);

app.get('/api/status', (req, res) => {
  res.json({
    message: 'SaaS Invoicing API is running.',
    stack: {
      mongodb: true,
      jsonServer: process.env.JSON_SERVER_URL || 'http://localhost:3001',
      firebase: Boolean(process.env.FIREBASE_DATABASE_URL)
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({ message: 'Erreur interne du serveur.' });
});

async function initializeSystem() {
  try {
    await connectDatabase();
    initFirebaseAdmin();
    await seedDefaultUsers();

    try {
      await warmUpEmailTransport();
    } catch (emailError) {
      console.warn('⚠️ Service email indisponible au démarrage:', emailError.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Express API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

initializeSystem();
