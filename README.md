# ClarifyEdu

**AI-Powered Adaptive Learning Engine for Neurodiverse Education**

ClarifyEdu dynamically reshapes unstructured educational content (PDF, TXT, DOCX) into adaptive cognitive formats optimized for neurodivergent learning styles — ADHD, Dyslexia, ASD, and Executive Dysfunction.

## Architecture

```
clarify_edu/
├── apps/
│   ├── web/          # Next.js 14 (App Router) + TypeScript + Tailwind
│   └── api/          # FastAPI + Pydantic v2 + Celery (async pipeline)
├── package.json      # npm workspaces root
└── tsconfig.json     # shared TypeScript base config
```

## Prerequisites

- **Node.js** ≥ 18.17
- **Python** ≥ 3.11
- **Redis** (Step 2+) — async job queue
- **MongoDB** (Step 2+) — document storage

## Quick Start

### Frontend

```bash
npm install
npm run dev:web
# → http://localhost:3000
```

### Backend

```bash
cd apps/api
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs
```

## Step 1 Validation

| Check | Command | Expected |
|-------|---------|----------|
| Frontend loads | Open `http://localhost:3000` | ClarifyEdu landing page |
| API liveness | `GET /api/v1/health` | `{ "status": "healthy", ... }` |
| API readiness | `GET /api/v1/health/ready` | `{ "services": { "api": "up" } }` |
| CORS | Frontend fetch to API health | No CORS errors |
| TypeScript | `npm run build --workspace=apps/web` | Clean compile |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#4F46E5` | Actions, links |
| Secondary | `#14B8A6` | Accents |
| Accent | `#F59E0B` | Focus states |
| BG Light | `#F8FAFC` | Default background |
| BG Dark | `#0F172A` | Focus / dark mode |

## License

Proprietary — ClarifyEdu
