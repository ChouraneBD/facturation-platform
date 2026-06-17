# Facturation Platform

Backend and frontend for the SaaS invoicing platform.

## Structure

- `server/`: Node.js, Express, Sequelize, PostgreSQL API
- `client/`: Vite + React admin frontend

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
- `GET /api/factures`
- `GET /api/parametres`
- `GET /api/dashboard/metrics`

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
