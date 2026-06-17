const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LigneFacture = sequelize.define('LigneFacture', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    facture_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'factures',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    article_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'articles',
            key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    designation_snapshot: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    quantite: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    prix_unitaire_applique: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    remise_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    tva_pct: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 20.00
    },
    total_ligne: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
    }
}, {
    tableName: 'lignes_facture',
    timestamps: false
});

module.exports = LigneFacture;