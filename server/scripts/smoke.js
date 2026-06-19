const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:5000';
const jsonServerUrl = process.env.JSON_SERVER_URL || 'http://localhost:3001';

async function request(base, path, options = {}) {
  const response = await fetch(base + path, options);
  const text = await response.text();

  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // keep raw text
  }

  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const uniqueSuffix = Date.now();
  const userEmail = `smoke.user.${uniqueSuffix}@example.com`;

  const adminLogin = await request(baseUrl, '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', mot_de_passe: 'password123' })
  });
  assert(adminLogin.status === 200, `admin login failed: ${JSON.stringify(adminLogin.body)}`);

  const adminHeaders = {
    Authorization: `Bearer ${adminLogin.body.token}`,
    'Content-Type': 'application/json'
  };

  const userRegister = await request(baseUrl, '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom: 'Smoke User', email: userEmail, mot_de_passe: 'Secret123', role: 'user' })
  });
  assert(userRegister.status === 201, `user register failed: ${JSON.stringify(userRegister.body)}`);

  const userLogin = await request(baseUrl, '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userEmail, mot_de_passe: 'Secret123' })
  });
  assert(userLogin.status === 200, `user login failed: ${JSON.stringify(userLogin.body)}`);

  const userHeaders = {
    Authorization: `Bearer ${userLogin.body.token}`,
    'Content-Type': 'application/json'
  };

  const categories = await request(jsonServerUrl, '/categories', { headers: userHeaders });
  assert(categories.status === 200, `categories failed: ${JSON.stringify(categories.body)}`);
  assert(Array.isArray(categories.body) && categories.body.length >= 4, 'default categories missing in JSON Server');

  const clientCreate = await request(baseUrl, '/api/clients', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({ nom: 'Smoke Client', email: `client.${uniqueSuffix}@example.com`, ville: 'Rabat' })
  });
  assert(clientCreate.status === 201, `client create failed: ${JSON.stringify(clientCreate.body)}`);

  const articleCreate = await request(jsonServerUrl, '/articles', {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      designation: 'Smoke Article',
      prix_unitaire: 100,
      categorie_id: categories.body[0].id,
      actif: true
    })
  });
  assert(articleCreate.status === 201, `article create failed: ${JSON.stringify(articleCreate.body)}`);

  const factureCreate = await request(baseUrl, '/api/factures', {
    method: 'POST',
    headers: userHeaders,
    body: JSON.stringify({
      client_id: clientCreate.body.client.id,
      methode_calcul: 1,
      remise_globale_pct: 5,
      lignes: [{ article_id: articleCreate.body.id, quantite: 2, prix_unitaire_applique: 100, remise_pct: 10 }]
    })
  });
  assert(factureCreate.status === 201, `facture create failed: ${JSON.stringify(factureCreate.body)}`);

  const factureId = factureCreate.body.facture.id;

  const paramUpsert = await request(jsonServerUrl, '/parametres/upsert', {
    method: 'PUT',
    headers: adminHeaders,
    body: JSON.stringify({ cle: 'nom_entreprise', valeur: 'Smoke Test SARL', description: 'Test param' })
  });
  assert(paramUpsert.status === 201 || paramUpsert.status === 200, `param upsert failed: ${JSON.stringify(paramUpsert.body)}`);

  const dashboard = await request(baseUrl, '/api/dashboard/metrics', { headers: adminHeaders });
  assert(dashboard.status === 200, `dashboard failed: ${JSON.stringify(dashboard.body)}`);
  assert(typeof dashboard.body.totals?.factures === 'number', 'dashboard totals are missing');

  const factureRead = await request(baseUrl, `/api/factures/${factureId}`, { headers: userHeaders });
  assert(factureRead.status === 200, `facture read failed: ${JSON.stringify(factureRead.body)}`);
  assert(Array.isArray(factureRead.body.lignes_facture) && factureRead.body.lignes_facture.length === 1, 'facture lines are missing');

  console.log('Smoke test passed');
}

main().catch((error) => {
  console.error('Smoke test failed');
  console.error(error.message || error);
  process.exit(1);
});
