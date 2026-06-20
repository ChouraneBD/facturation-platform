const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Facture = sequelize.define('Facture', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  numero: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  date_creation: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  statut: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  methode_calcul: {
    type: DataTypes.SMALLINT,
    allowNull: false
  },
  remise_globale_pct: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  total_ht: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  tva: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_ttc: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  date_depot: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_encaissement: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  type_virement: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  signature_base64: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pdf_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  commentaire_admin: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  validated_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  validated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'factures',
  timestamps: false
});

module.exports = Facture;
