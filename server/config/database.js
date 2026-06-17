const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    String(process.env.DB_PASSWORD || 'C41CF281DC'), // Updated fallback password
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false, // Prevents terminal spam with SQL queries during development
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

module.exports = sequelize;