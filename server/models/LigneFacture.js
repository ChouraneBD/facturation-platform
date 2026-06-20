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
    allowNull: false
  },
  article_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  designation_snapshot: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  prix_unitaire_applique: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  remise_pct: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  tva_pct: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false
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
