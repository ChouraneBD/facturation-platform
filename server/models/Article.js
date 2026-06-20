const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  designation: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  categorie_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'articles',
  timestamps: false
});

module.exports = Article;
