const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const sequelize = require('./config/database'); // Import Database Configuration
const User = require('./models/User');
const Client = require('./models/Client');
const Category = require('./models/Category');
const Article = require('./models/Article');
const Facture = require('./models/Facture');
const LigneFacture = require('./models/LigneFacture');
const Parametre = require('./models/Parametre');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const articleRoutes = require('./routes/articleRoutes');
const factureRoutes = require('./routes/factureRoutes');
const parametresRoutes = require('./routes/parametresRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { seedDefaultCategories } = require('./controllers/categoriesController');
const { warmUpEmailTransport } = require('./services/emailService');

Category.hasMany(Article, { foreignKey: 'categorie_id', onDelete: 'SET NULL' });
Article.belongsTo(Category, { foreignKey: 'categorie_id', onDelete: 'SET NULL' });
Client.hasMany(Facture, { foreignKey: 'client_id' });
User.hasMany(Facture, { foreignKey: 'user_id' });
User.hasMany(Facture, { foreignKey: 'validated_by' });
Facture.belongsTo(Client, { foreignKey: 'client_id' });
Facture.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Facture.belongsTo(User, { foreignKey: 'validated_by', as: 'validatedBy' });
Facture.hasMany(LigneFacture, { foreignKey: 'facture_id', as: 'lignes_facture', onDelete: 'CASCADE' });
LigneFacture.belongsTo(Facture, { foreignKey: 'facture_id', onDelete: 'CASCADE' });
LigneFacture.belongsTo(Article, { foreignKey: 'article_id', onDelete: 'SET NULL' });

const app = express();
const PORT = 5000;

// Application Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/parametres', parametresRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Diagnostics Endpoint
app.get('/api/status', (req, res) => {
    res.json({ message: "SaaS Invoicing API is running smoothly on Debian." });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route introuvable.' });
});

app.use((error, req, res, next) => {
    console.error('Unhandled server error:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
});

// Verify Database Link & Instantiate Listeners
async function initializeSystem() {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL database connection has been established successfully.');
        
        // Sync models with active database schema without dropping matching structures
        await sequelize.sync({ alter: true });
        console.log('✅ All database tables synchronized successfully.');

        await seedDefaultCategories();
        console.log('✅ Default categories seeded successfully.');

        try {
            await warmUpEmailTransport();
        } catch (emailError) {
            console.warn('⚠️ Service email indisponible au démarrage:', emailError.message);
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server successfully operating on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Unable to connect to the database securely:', error);
        process.exit(1);
    }
}

initializeSystem();