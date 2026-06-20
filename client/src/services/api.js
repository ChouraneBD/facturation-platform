export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

export async function api(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  const url = `${API_URL}${path}`;

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    throw new Error(
      `Impossible de joindre l'API (${API_URL}). ` +
      'Vérifiez que PostgreSQL et le serveur Express sont démarrés (cd server && npm start).'
    );
  }

  const text = await response.text();
  const data = parseBody(text);

  if (!response.ok) {
    const message = data && typeof data === 'object' && data.message ? data.message : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}
