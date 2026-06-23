# Event Staff Schedule & Location Tracker

Monorepo with a FastAPI backend and a React (Vite + Tailwind) frontend.

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API: http://localhost:8000 · Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: http://localhost:5173

Default login: **admin / admin123**

## Notes

- SQLite by default (`./app.db`). Set `DATABASE_URL` in `.env` for Postgres.
- Admin-only mutations; any authenticated user can read.
- Time grid: 48 half-hour slots covering 00:00–24:00.
