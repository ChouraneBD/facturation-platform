require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Article = require('../models/Article');

async function seedDatabase() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database for seeding.');
        
        // 1. Ensure models are synced
        await sequelize.sync({ alter: true });

        // 2. Create Users
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const [admin] = await User.findOrCreate({
            where: { email: 'admin@test.com' },
            defaults: {
                nom: 'Admin TechPro',
                mot_de_passe: hashedPassword,
                role: 'admin'
            }
        });
        console.log(`👤 Admin user ensured: ${admin.email}`);

        const [client] = await User.findOrCreate({
            where: { email: 'client@test.com' },
            defaults: {
                nom: 'Client Dupont',
                mot_de_passe: hashedPassword,
                role: 'user'
            }
        });
        console.log(`👤 Client user ensured: ${client.email}`);

        // 3. Create Categories
        const catWeb = await Category.findOrCreate({ where: { nom: 'Développement Web', taux_tva: 20 } });
        const catConsulting = await Category.findOrCreate({ where: { nom: 'Consulting IT', taux_tva: 20 } });
        const catSaaS = await Category.findOrCreate({ where: { nom: 'Licences Logiciel', taux_tva: 20 } });

        console.log('📂 Categories ensured.');

        // 4. Create Articles
        const articlesToSeed = [
            { designation: 'Création de site vitrine', prix_unitaire: 1200.00, categorie_id: catWeb[0].id, actif: true },
            { designation: 'Audit de sécurité', prix_unitaire: 800.00, categorie_id: catConsulting[0].id, actif: true },
            { designation: 'Abonnement ERP (Annuel)', prix_unitaire: 2400.00, categorie_id: catSaaS[0].id, actif: true },
            { designation: 'Installation Réseau', prix_unitaire: 500.00, categorie_id: catConsulting[0].id, actif: true },
            { designation: 'Consulting Architecture Cloud', prix_unitaire: 900.00, categorie_id: catConsulting[0].id, actif: true }
        ];

        for (const article of articlesToSeed) {
            await Article.findOrCreate({
                where: { designation: article.designation },
                defaults: article
            });
        }
        console.log('📦 Articles seeded.');

        console.log('✨ Database seeding complete! You can now log in with admin@test.com or client@test.com (password: password123)');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
