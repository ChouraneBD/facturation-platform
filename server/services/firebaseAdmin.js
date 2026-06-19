const { getFirebaseAdmin, isFirebaseConfigured } = require('../config/firebase');

const ALERTS_PATH = 'workflow_alerts';

function getDatabase() {
  const admin = getFirebaseAdmin();
  if (!admin) {
    return null;
  }
  return admin.database();
}

async function pushAlert(payload) {
  const db = getDatabase();
  if (!db) {
    console.warn('[firebaseAdmin] Firebase not configured — alert skipped:', payload.message);
    return null;
  }

  const alert = {
    ...payload,
    lu: false,
    created_at: new Date().toISOString()
  };

  const ref = await db.ref(ALERTS_PATH).push(alert);
  return { id: ref.key, ...alert };
}

module.exports = {
  isFirebaseConfigured,
  pushAlert
};
