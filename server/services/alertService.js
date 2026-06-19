const User = require('../models/User');
const { pushAlert } = require('./firebaseAdmin');

const ALERT_TYPES = {
  CREATED: 'facture_created',
  VALIDATED: 'facture_validated',
  REJECTED: 'facture_rejected',
  PAID: 'facture_paid'
};

async function createWorkflowAlert({ userId = null, type, message, factureNumero = null }) {
  return pushAlert({
    user_id: userId ? String(userId) : null,
    type,
    message,
    facture_numero: factureNumero
  });
}

async function notifyAdmins(type, message, factureNumero) {
  const admins = await User.find({ role: 'admin' });
  const results = [];

  for (const admin of admins) {
    results.push(await createWorkflowAlert({
      userId: admin.id,
      type,
      message,
      factureNumero
    }));
  }

  if (admins.length === 0) {
    results.push(await createWorkflowAlert({ type, message, factureNumero }));
  }

  return results;
}

async function notifyUser(userId, type, message, factureNumero) {
  if (!userId) {
    return createWorkflowAlert({ type, message, factureNumero });
  }
  return createWorkflowAlert({ userId, type, message, factureNumero });
}

module.exports = {
  ALERT_TYPES,
  createWorkflowAlert,
  notifyAdmins,
  notifyUser
};
