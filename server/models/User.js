const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    mot_de_passe: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['admin', 'user']]
        }
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('NOW()')
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;