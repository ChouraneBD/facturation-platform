/**
 * jsonService.js — couche CRUD via l'API Express + PostgreSQL.
 */
import { api } from './api';

function withToken(token) {
  return token ? { token } : {};
}

export const authService = {
  login: (payload) => api('/api/auth/login', { method: 'POST', body: payload }),
  register: (payload) => api('/api/auth/register', { method: 'POST', body: payload })
};

export const clientsService = {
  list: (token) => api('/api/clients', withToken(token)),
  get: (id, token) => api(`/api/clients/${id}`, withToken(token)),
  create: (payload, token) => api('/api/clients', { method: 'POST', body: payload, ...withToken(token) }),
  update: (id, payload, token) => api(`/api/clients/${id}`, { method: 'PUT', body: payload, ...withToken(token) }),
  remove: (id, token) => api(`/api/clients/${id}`, { method: 'DELETE', ...withToken(token) })
};

export const categoriesService = {
  list: (token) => api('/api/categories', withToken(token)),
  get: (id, token) => api(`/api/categories/${id}`, withToken(token)),
  create: (payload, token) => api('/api/categories', { method: 'POST', body: payload, ...withToken(token) }),
  update: (id, payload, token) => api(`/api/categories/${id}`, { method: 'PUT', body: payload, ...withToken(token) }),
  remove: (id, token) => api(`/api/categories/${id}`, { method: 'DELETE', ...withToken(token) })
};

export const articlesService = {
  list: (token) => api('/api/articles', withToken(token)),
  get: (id, token) => api(`/api/articles/${id}`, withToken(token)),
  create: (payload, token) => api('/api/articles', { method: 'POST', body: payload, ...withToken(token) }),
  update: (id, payload, token) => api(`/api/articles/${id}`, { method: 'PUT', body: payload, ...withToken(token) }),
  remove: (id, token) => api(`/api/articles/${id}`, { method: 'DELETE', ...withToken(token) })
};

export const facturesService = {
  list: (token, query = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.statut) params.set('statut', query.statut);
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    if (query.annee) params.set('annee', query.annee);
    const qs = params.toString();
    return api(`/api/factures${qs ? `?${qs}` : ''}`, withToken(token));
  },
  get: (id, token) => api(`/api/factures/${id}`, withToken(token)),
  create: (payload, token) => api('/api/factures', { method: 'POST', body: payload, ...withToken(token) }),
  updateStatus: (id, payload, token) => api(`/api/factures/${id}/statut`, { method: 'PATCH', body: payload, ...withToken(token) }),
  validate: (id, payload, token) => api(`/api/factures/${id}/validation`, { method: 'PATCH', body: payload, ...withToken(token) }),
  updateGlobalDiscount: (id, payload, token) => api(`/api/factures/${id}/remise-globale`, { method: 'PATCH', body: payload, ...withToken(token) })
};

export const parametresService = {
  list: (token) => api('/api/parametres', withToken(token)),
  get: (cle, token) => api(`/api/parametres/${cle}`, withToken(token)),
  upsert: (payload, token) => api('/api/parametres', { method: 'PUT', body: payload, ...withToken(token) })
};

export const dashboardService = {
  metrics: (token, query = {}) => {
    const params = new URLSearchParams();
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);
    if (query.annee) params.set('annee', query.annee);
    const qs = params.toString();
    return api(`/api/dashboard/metrics${qs ? `?${qs}` : ''}`, withToken(token));
  }
};

export const contactService = {
  send: (payload) => api('/api/contact', { method: 'POST', body: payload })
};

export async function loadAppSettings(token) {
  const parametres = await parametresService.list(token);
  const map = Object.fromEntries(parametres.map((p) => [p.cle, p.valeur]));
  return {
    societeNom: map.societe_nom || 'TechPro Services',
    societeAdresse: map.societe_adresse || '',
    societeEmail: map.societe_email || '',
    societeTelephone: map.societe_telephone || '',
    societeTagline: map.societe_tagline || '',
    logoBase64: map.logo_base64 || '',
    devise: map.devise || 'EUR'
  };
}
