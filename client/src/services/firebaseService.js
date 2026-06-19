/**
 * firebaseService.js — alertes workflow temps réel.
 * Le cahier des charges prévoit Firebase Realtime Database ;
 * ici PostgreSQL + polling remplace Firebase tout en conservant la même API front.
 */
import { api } from './api';

const LOCAL_ALERTS_KEY = 'facturation_workflow_alerts';

export const ALERT_TYPES = {
  CREATED: 'facture_created',
  VALIDATED: 'facture_validated',
  REJECTED: 'facture_rejected',
  PAID: 'facture_paid'
};

export function getLocalAlerts() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ALERTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function pushLocalAlert(alert) {
  const alerts = getLocalAlerts();
  alerts.unshift({ ...alert, id: `local-${Date.now()}`, lu: false, created_at: new Date().toISOString() });
  localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(alerts.slice(0, 50)));
}

export async function fetchAlerts(token) {
  const remote = await api('/api/alerts', { token });
  const local = getLocalAlerts();
  const merged = [...remote, ...local.filter((l) => !remote.some((r) => r.message === l.message))];
  return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function markAlertAsRead(id, token) {
  if (String(id).startsWith('local-')) {
    const alerts = getLocalAlerts().map((a) => (a.id === id ? { ...a, lu: true } : a));
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(alerts));
    return { message: 'Alerte locale marquée comme lue.' };
  }
  return api(`/api/alerts/${id}/read`, { method: 'PATCH', token });
}

export function subscribeToAlerts(token, callback, intervalMs = 30000) {
  let active = true;

  const poll = async () => {
    if (!active || !token) return;
    try {
      const alerts = await fetchAlerts(token);
      callback(alerts);
    } catch (error) {
      console.warn('[firebaseService] poll error:', error.message);
    }
  };

  poll();
  const timer = window.setInterval(poll, intervalMs);

  return () => {
    active = false;
    window.clearInterval(timer);
  };
}

export function notifyWorkflowAlert(type, { numero, message }) {
  pushLocalAlert({ type, facture_numero: numero, message });
}
