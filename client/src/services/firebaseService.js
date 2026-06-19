/**
 * firebaseService.js — alertes workflow via Firebase Realtime Database (cahier des charges PFA).
 */
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, onValue, ref, update, off } from 'firebase/database';
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase';

export const ALERT_TYPES = {
  CREATED: 'facture_created',
  VALIDATED: 'facture_validated',
  REJECTED: 'facture_rejected',
  PAID: 'facture_paid'
};

let database = null;

function getDb() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!database) {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    database = getDatabase(app);
  }

  return database;
}

function normalizeAlert(id, value) {
  return {
    id,
    user_id: value.user_id ?? null,
    type: value.type,
    message: value.message,
    facture_numero: value.facture_numero ?? null,
    lu: Boolean(value.lu),
    created_at: value.created_at
  };
}

function filterAlertsForUser(alerts, { userId, role }) {
  const sorted = alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (role === 'admin') {
    return sorted.slice(0, 50);
  }

  return sorted
    .filter((alert) => alert.user_id === String(userId))
    .slice(0, 50);
}

export async function fetchAlerts({ userId, role }) {
  const db = getDb();
  if (!db) {
    return [];
  }

  return new Promise((resolve, reject) => {
    const alertsRef = ref(db, 'workflow_alerts');
    onValue(
      alertsRef,
      (snapshot) => {
        const value = snapshot.val() || {};
        const alerts = Object.entries(value).map(([id, alert]) => normalizeAlert(id, alert));
        resolve(filterAlertsForUser(alerts, { userId, role }));
      },
      reject,
      { onlyOnce: true }
    );
  });
}

export async function markAlertAsRead(id, { userId, role }) {
  const db = getDb();
  if (!db) {
    throw new Error('Firebase Realtime Database non configuré.');
  }

  const alerts = await fetchAlerts({ userId, role });
  const alert = alerts.find((item) => item.id === id);

  if (!alert) {
    throw new Error('Alerte introuvable.');
  }

  if (role !== 'admin' && alert.user_id !== String(userId)) {
    throw new Error('Accès interdit.');
  }

  await update(ref(db, `workflow_alerts/${id}`), { lu: true });
  return { message: 'Alerte marquée comme lue.', alert: { ...alert, lu: true } };
}

export function subscribeToAlerts({ userId, role }, callback) {
  const db = getDb();
  if (!db || !userId) {
    return () => {};
  }

  const alertsRef = ref(db, 'workflow_alerts');

  const listener = (snapshot) => {
    const value = snapshot.val() || {};
    const alerts = Object.entries(value).map(([id, alert]) => normalizeAlert(id, alert));
    callback(filterAlertsForUser(alerts, { userId, role }));
  };

  onValue(alertsRef, listener);

  return () => off(alertsRef, 'value', listener);
}

export function notifyWorkflowAlert(type, { numero, message }) {
  console.info('[firebaseService] local workflow hint:', type, numero, message);
}
