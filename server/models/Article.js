const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Article = sequelize.define('Article', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    designation: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    prix_unitaire: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    categorie_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    actif: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: sequelize.literal('NOW()')
    }
}, {
    tableName: 'articles',
    timestamps: false
});

module.exports = Article;