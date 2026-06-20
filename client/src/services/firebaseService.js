/**
 * firebaseService.js — alertes workflow via l'API Express (PostgreSQL).
 */
import { api } from './api';

export const ALERT_TYPES = {
  CREATED: 'facture_created',
  VALIDATED: 'facture_validated',
  REJECTED: 'facture_rejected',
  PAID: 'facture_paid'
};

export async function fetchAlerts(token) {
  if (!token) {
    return [];
  }
  return api('/api/alerts', { token });
}

export async function markAlertAsRead(id, token) {
  return api(`/api/alerts/${id}/read`, { method: 'PATCH', token });
}

export function subscribeToAlerts(token, callback) {
  if (!token) {
    return () => {};
  }

  let active = true;

  const poll = async () => {
    if (!active) {
      return;
    }

    try {
      const alerts = await fetchAlerts(token);
      if (active) {
        callback(alerts);
      }
    } catch (error) {
      console.warn('[alertService] polling error:', error.message);
    }
  };

  poll();
  const intervalId = setInterval(poll, 15000);

  return () => {
    active = false;
    clearInterval(intervalId);
  };
}
