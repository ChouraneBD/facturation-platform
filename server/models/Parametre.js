const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Parametre = sequelize.define('Parametre', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cle: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  valeur: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'parametres',
  timestamps: false
});

module.exports = Parametre;
