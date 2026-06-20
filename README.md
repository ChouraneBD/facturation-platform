# Facturation Platform

Application web de gestion de facturation — PFA EMSI Casablanca.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 19 + Vite + Material UI |
| Backend | Express + Sequelize |
| Base de données | PostgreSQL |
| Auth | JWT + rôles (admin / user) |
| PDF | jsPDF + jsPDF-autotable |
| Formulaires | Formik + Yup |

## Architecture

```
client (React :5173)
  └── jsonService.js → Express API (:5000)

server (Express :5000)
  └── PostgreSQL (users, clients, factures, articles, categories, parametres, workflow_alerts)
```

## Prérequis

- Node.js 18+
- PostgreSQL en local

## Configuration

Copier `server/.env.example` vers `server/.env` et renseigner :

- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`
- `JWT_SECRET`
- Variables SMTP (optionnel, pour les emails)

Copier `client/.env.example` vers `client/.env` :

- `VITE_API_URL=http://localhost:5000`

## Démarrage

```bash
# Installer toutes les dépendances
npm run install:all

# Lancer Express + React
npm run dev
```

Ou séparément :

```bash
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
# Le serveur Express doit être démarré
cd server && npm run smoke
```
