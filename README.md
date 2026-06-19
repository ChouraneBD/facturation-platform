# Facturation Platform

Application web de gestion de facturation — PFA EMSI Casablanca.

## Conformité cahier des charges

| Exigence | Implémentation |
|----------|----------------|
| React JS | `client/` — React 19 + Vite |
| Material UI | `@mui/material` |
| JSON Server | `json-server/` — articles, catégories, paramètres (`jsonService.js`) |
| Firebase Realtime Database | `firebaseService.js` — alertes workflow temps réel |
| MongoDB | `server/` — clients, factures, utilisateurs |
| jsPDF | Génération PDF avec logo, signature, QR |
| Formik + Yup | Validation des formulaires |
| JWT + rôles | Auth Express, protection des routes |

## Architecture

```
client (React)
  ├── jsonService.js  → JSON Server :3001  (articles, categories, parametres)
  ├── jsonService.js  → Express :5000       (auth, clients, factures, dashboard)
  └── firebaseService.js → Firebase RTDB    (alertes workflow)

server (Express + MongoDB)
  └── écrit les alertes dans Firebase via Firebase Admin

json-server (db.json)
  └── articles.json structure du cahier des charges
```

## Prérequis

- Node.js 18+
- MongoDB en local (`mongodb://127.0.0.1:27017/facturation`)
- Projet Firebase avec **Realtime Database** activée

## Configuration

### 1. Server (`server/.env`)

Copier `server/.env.example` vers `server/.env` et renseigner :

- `MONGODB_URI`
- `JWT_SECRET`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DATABASE_URL`

### 2. Client (`client/.env`)

Copier `client/.env.example` vers `client/.env` et renseigner les variables `VITE_FIREBASE_*`.

### 3. Firebase Realtime Database — règles (dev)

```json
{
  "rules": {
    "workflow_alerts": {
      ".read": true,
      ".write": true
    }
  }
}
```

Pour la production, restreindre la lecture/écriture aux utilisateurs authentifiés.

## Démarrage

```bash
# Installer toutes les dépendances
npm run install:all

# Lancer JSON Server + Express + React
npm run dev
```

Ou séparément :

```bash
npm run dev:json-server   # http://localhost:3001
npm run dev:server        # http://localhost:5000
npm run dev:client        # http://localhost:5173
```

## Comptes de test

Créés automatiquement au démarrage du serveur :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@test.com | password123 | admin |
| client@test.com | password123 | user |

## Smoke test

```bash
# JSON Server et Express doivent être démarrés
cd server && npm run smoke
```

## Données JSON Server

Le fichier `json-server/db.json` contient la structure du cahier des charges :

- `articles` — catalogue produits/services
- `categories` — Informatique (20%), Services (10%), Formation (0%), Fournitures (20%)
- `parametres` — configuration société, devise, logo
