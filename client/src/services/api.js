export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const JSON_SERVER_URL = import.meta.env.VITE_JSON_SERVER_URL || 'http://localhost:3001';

function parseBody(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function api(path, { method = 'GET', token, body, baseUrl = API_URL } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const data = parseBody(text);

  if (!response.ok) {
    const message = data && typeof data === 'object' && data.message ? data.message : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function jsonApi(path, options = {}) {
  return api(path, { ...options, baseUrl: JSON_SERVER_URL });
}
