const path = require('path');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jsonServer = require('json-server');

require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const PORT = Number(process.env.JSON_SERVER_PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'C41CF281DC';
const DB_PATH = path.join(__dirname, 'db.json');

const server = jsonServer.create();
const router = jsonServer.router(DB_PATH);
const middlewares = jsonServer.defaults();

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function verifyToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  try {
    return jwt.verify(header.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }
}

function isPublicRead(req) {
  return req.method === 'GET' && /^\/articles(\/\d+)?$/.test(req.path);
}

function requiresAuth(req) {
  if (isPublicRead(req)) {
    return false;
  }
  return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
}

function requiresAdmin(req) {
  if (req.method === 'GET') {
    return false;
  }
  return /^\/(categories|articles|parametres)(\/|$)/.test(req.path) || req.path === '/parametres/upsert';
}

server.use(cors());
server.use(jsonServer.bodyParser);
server.use(middlewares);

server.use((req, res, next) => {
  if (!requiresAuth(req)) {
    return next();
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Accès refusé. Token Bearer manquant ou invalide.' });
  }

  if (requiresAdmin(req) && user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit. Rôle admin requis.' });
  }

  req.user = user;
  return next();
});

server.put('/parametres/upsert', (req, res) => {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Accès refusé. Token Bearer manquant ou invalide.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès interdit. Rôle admin requis.' });
  }

  const { cle, valeur, description } = req.body || {};
  if (!cle || valeur === undefined || valeur === null) {
    return res.status(400).json({ message: 'cle et valeur sont obligatoires.' });
  }

  const db = readDb();
  const existingIndex = db.parametres.findIndex((item) => item.cle === cle);

  if (existingIndex >= 0) {
    db.parametres[existingIndex] = {
      ...db.parametres[existingIndex],
      valeur,
      description: description ?? db.parametres[existingIndex].description
    };
    writeDb(db);
    return res.status(200).json({
      message: 'Paramètre mis à jour avec succès.',
      parametre: db.parametres[existingIndex]
    });
  }

  const nextId = db.parametres.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
  const created = { id: nextId, cle, valeur, description: description || null };
  db.parametres.push(created);
  writeDb(db);

  return res.status(201).json({
    message: 'Paramètre créé avec succès.',
    parametre: created
  });
});

server.get('/parametres/key/:cle', (req, res) => {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ message: 'Accès refusé. Token Bearer manquant ou invalide.' });
  }

  const db = readDb();
  const parametre = db.parametres.find((item) => item.cle === req.params.cle);
  if (!parametre) {
    return res.status(404).json({ message: 'Paramètre introuvable.' });
  }
  return res.json(parametre);
});

server.use(router);

server.listen(PORT, () => {
  console.log(`JSON Server running on http://localhost:${PORT}`);
});
