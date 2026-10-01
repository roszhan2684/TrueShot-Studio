# TrueShot Studio — Architecture Reference

## Overview

TrueShot Studio is a pnpm monorepo with two primary applications and one shared types package.

```
headshotai/
├── apps/
│   ├── web/          # Next.js 14 App Router frontend
│   └── api/          # FastAPI backend + Celery workers
├── packages/
│   └── types/        # Shared TypeScript domain types
├── infra/
│   └── docker/       # Docker Compose for local dev
└── docs/
```

## Frontend (apps/web)

Next.js 14 App Router with three route groups:

| Route Group | Paths | Auth Required |
|---|---|---|
| `(marketing)` | `/`, `/how-it-works`, `/pricing`, etc. | No |
| `(auth)` | `/sign-in`, `/sign-up` | No |
| `(app)` | `/dashboard`, `/photoshoot/*`, etc. | Yes |

### State Management
- **Server state**: TanStack Query (API data, polling)
- **Client state**: Zustand (editor selections, upload queue, UI state)
- **Auth state**: Clerk (session, user object)

### Key Frontend Stores
- `usePhotoshootStore` — active job, progress, step
- `useEditorStore` — selected headshot, edit parameters, history
- `useGalleryStore` — selections, compare mode, filters

## Backend (apps/api)

FastAPI with async SQLAlchemy, five Celery worker queues:

```
intake → generation → evaluation
                          ↓
                       editing
                          ↓
                        export
```

### Worker Queues

| Queue | Concurrency | Purpose |
|---|---|---|
| `intake` | 2 | Image validation, quality scoring, embedding creation |
| `generation` | 1 | AI image generation (GPU-bound) |
| `evaluation` | 2 | Quality scoring all outputs |
| `editing` | 2 | Edit job execution |
| `export` | 4 | Format conversion, presigned URL generation |

### AI Service Layer
All AI calls go through swappable service interfaces in `app/services/`:
- `ImageGenerationService` — provider: Replicate / Stability / OpenAI
- `FaceEmbeddingService` — provider: InsightFace / AWS Rekognition
- `QualityEvaluationService` — provider: custom scoring pipeline
- `BackgroundRemovalService` — provider: RemBG / Replicate

Providers are selected via config, making it easy to swap without touching business logic.

## Database Schema

All primary keys use ULID (sortable, URL-safe, no UUID fragmentation).

### Core tables
- `users` — Clerk-backed user records
- `workspaces` — team accounts (future enterprise)
- `team_invites` — pending invitations
- `photoshoot_jobs` — generation jobs with status machine
- `uploaded_reference_images` — per-upload quality signals
- `identity_profiles` — face embeddings (backend-only, never sent to client)
- `generated_headshots` — outputs with quality scores and rankings
- `edit_jobs` — surgical edit operations on headshots
- `export_assets` — formatted output files with expiry
- `billing_customers` — Stripe customer IDs
- `subscriptions` — Stripe subscription state
- `audit_events` — immutable event log for privacy/compliance

## Storage Architecture

Two S3 buckets:
- `trueshot-uploads` — reference images (deleted after job completes per retention policy)
- `trueshot-outputs` — generated headshots, edit results, exports

All client access via presigned URLs. No direct bucket access.

## Auth Flow

1. User authenticates via Clerk
2. Clerk JWT is sent in `Authorization: Bearer` header
3. FastAPI verifies via Clerk SDK (`app/core/auth.py`)
4. User record created on first sign-in via Clerk webhook

## Privacy Architecture

- Reference uploads: deleted after job completion (configurable, default 30 days)
- Embeddings: stored backend-only, deletable on request
- Outputs: user-controlled retention, 1-click full delete
- Audit log: immutable for 90 days, then archived
- No PII in logs or error messages
- GDPR/CCPA data deletion: single endpoint triggers full cascade

## Pricing Tiers (planned)

| Plan | Photoshoots/mo | Outputs/shoot | Price |
|---|---|---|---|
| Starter | 1 | 8 | $29 |
| Pro | 5 | 20 | $79 |
| Team | 20 + members | 24 | $199 |
