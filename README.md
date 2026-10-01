# TrueShot Studio

> AI headshots that look like you, not an AI version of you.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, SQLAlchemy 2 (async), PostgreSQL, Alembic |
| Queue | Celery, Redis |
| Storage | S3 / MinIO (local dev) |
| Auth | Clerk |
| Payments | Stripe |
| Monorepo | pnpm workspaces + Turborepo |

## Repository layout

```
headshotai/
├── apps/
│   ├── api/          FastAPI backend + Celery workers
│   └── web/          Next.js frontend
├── packages/
│   └── types/        Shared TypeScript types
├── infra/
│   └── docker/       docker-compose for local dev
└── docs/
    └── ARCHITECTURE.md
```

## Quick start (Docker)

```bash
# 1. Clone and install JS deps
pnpm install

# 2. Copy env templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Fill in required secrets (see "Required secrets" below)
#    Minimum: CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# 4. Start everything
docker compose -f infra/docker/docker-compose.yml up

# 5. Run migrations
docker compose exec api alembic upgrade head

# Services:
#   Web:     http://localhost:3000
#   API:     http://localhost:8000/docs
#   MinIO:   http://localhost:9001  (minioadmin / minioadmin)
#   Flower:  http://localhost:5555  (Celery task monitor)
```

## Local dev (without Docker)

### Prerequisites

- Node 20+ with pnpm
- Python 3.11+
- PostgreSQL 16
- Redis 7
- MinIO (or AWS S3 credentials)

### Backend

```bash
cd apps/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install deps
pip install -e ".[dev]"

# Configure env
cp .env.example .env
# Edit .env — at minimum set CLERK_SECRET_KEY

# Run migrations
alembic upgrade head

# Start API
uvicorn app.main:app --reload --port 8000

# Start workers (each in a separate terminal)
celery -A app.workers.celery_app worker -Q intake -c 2 -l info
celery -A app.workers.celery_app worker -Q generation -c 1 -l info
celery -A app.workers.celery_app worker -Q evaluation -c 2 -l info
celery -A app.workers.celery_app worker -Q editing -c 2 -l info
celery -A app.workers.celery_app worker -Q export -c 2 -l info
```

### Frontend

```bash
cd apps/web

cp .env.example .env.local
# Edit .env.local — set CLERK keys

pnpm dev
```

### MinIO (local S3)

```bash
# Start MinIO
minio server ~/minio-data --console-address :9001

# Create buckets (one-time setup)
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/trueshot-uploads
mc mb local/trueshot-outputs
mc anonymous set public local/trueshot-outputs
```

## Required secrets

### Clerk (auth)

1. Create an app at [clerk.com](https://clerk.com)
2. Copy `Publishable Key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Copy `Secret Key` → `CLERK_SECRET_KEY` (both API and web)
4. Add a webhook endpoint pointing to `https://your-domain/api/webhooks/clerk`
5. Copy webhook signing secret → `CLERK_WEBHOOK_SECRET`

### Stripe (billing)

1. Create an account at [stripe.com](https://stripe.com)
2. Create 6 products with prices (Starter/Pro/Team × monthly/annual)
3. Copy price IDs → `STRIPE_PRICE_*` env vars in web `.env.local`
4. Copy secret key → `STRIPE_SECRET_KEY`
5. Add webhook → `https://your-domain/api/webhooks/stripe`
6. Copy webhook secret → `STRIPE_WEBHOOK_SECRET`

### AWS S3 (production only)

Replace MinIO env vars with real AWS credentials:

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_ENDPOINT_URL=        # leave blank for real AWS
S3_BUCKET_UPLOADS=trueshot-uploads-prod
S3_BUCKET_OUTPUTS=trueshot-outputs-prod
```

## Running tests

```bash
cd apps/api

# Unit tests only (no DB required)
pytest tests/unit -v

# All tests (requires Postgres + Redis)
pytest -v
```

## API documentation

When running locally, interactive docs are available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Pipeline architecture

```
User upload → intake queue
                ↓
         Quality scoring
         Identity profile build
                ↓
         generation queue
                ↓
         Mock generation (per style pack)
         S3 storage
                ↓
         evaluation queue
                ↓
         Quality scoring
         Rank assignment
                ↓
         Job status → completed
                ↓
         Results gallery (frontend polling)
```

Progress is tracked in Redis at `progress:{job_id}` and polled by the frontend every 2.5 seconds.

## Deployment notes

- All presigned URLs are scoped to the requesting user's ID prefix — no cross-user access
- Clerk JWT verification happens in FastAPI, not in Next.js middleware
- Stripe webhooks are signature-verified in Next.js before forwarding to FastAPI
- Data deletion cascade respects FK order: exports → edit_jobs → headshots → identity_profiles → reference_images → photoshoots
- Audit events are retained 90 days and never hard-deleted
