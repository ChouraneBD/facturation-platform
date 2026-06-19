# Facturation Platform

Backend and frontend for the SaaS invoicing platform (PFA EMSI Casablanca).

## Conformité cahier des charges

| Exigence | Implémentation |
|----------|----------------|
| React JS | `client/` — React 19 + Vite |
| Material UI | `@mui/material` — dashboard, login, composants partagés |
| JSON Server (CRUD) | `jsonService.js` → API REST Express + PostgreSQL |
| Firebase (alertes) | `firebaseService.js` → table `workflow_alerts` + polling |
| jsPDF | Génération PDF avec logo, signature, QR |
| Export Excel | Bouton export sur la page Factures (`xlsx`) |
| Multi-devise | Paramètre `devise` (EUR, MAD, USD) |
| Archivage annuel | Filtre par année sur factures + dashboard |
| Alertes workflow | Création / validation / rejet / paiement |

## Structure

- `server/`: Node.js, Express, Sequelize, PostgreSQL API
- `client/`: Vite + React + Material UI

## Services frontend (architecture PFA)

- `client/src/services/jsonService.js` — CRUD clients, articles, factures, paramètres
- `client/src/services/firebaseService.js` — alertes workflow temps réel
- `client/src/services/api.js` — couche HTTP bas niveau


## Backend

### Requirements

- PostgreSQL running locally
- `server/.env` configured with:
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_HOST`
  - `JWT_SECRET` optional, fallback is `C41CF281DC`

### Start

```bash
cd server
npm install
npm start
```

### Useful API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/clients`
- `GET /api/categories`
- `GET /api/articles`
- `GET /api/factures?annee=2025`
- `GET /api/parametres`
- `GET /api/dashboard/metrics?annee=2025`
- `GET /api/alerts`
- `POST /api/contact`

### Smoke test

```bash
cd server
npm run smoke
```

## Frontend

### Start

```bash
cd client
npm install
npm run dev
```

### Build

```bash
cd client
npm run build
```

### API URL

Set `VITE_API_URL` in `client/.env` if the API is not running at `http://localhost:5000`.

## Status

The backend has been verified with live API smoke tests, and the frontend builds successfully.
