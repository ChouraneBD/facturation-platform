const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    tel: {
        type: DataTypes.STRING(25),
        allowNull: true
    },
    adresse: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ville: {
        type: DataTypes.STRING(80),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('NOW()')
    }
}, {
    tableName: 'clients',
    timestamps: false
});

module.exports = Client;