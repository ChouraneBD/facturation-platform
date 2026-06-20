const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkflowAlert = sequelize.define('WorkflowAlert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  facture_numero: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'workflow_alerts',
  timestamps: false
});

module.exports = WorkflowAlert;
