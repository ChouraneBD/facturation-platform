const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  taux_tva: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20.0
  }
}, {
  tableName: 'categories',
  timestamps: false
});

module.exports = Category;
