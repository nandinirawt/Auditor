# UXSense

An **AI Conversational UX Auditor** — a full-stack SaaS that crawls a website,
captures screenshots, runs accessibility (axe-core) and performance (Lighthouse)
analysis, simulates user journeys, and uses an LLM to produce explainable
recommendations and ready-to-ship code fixes.

This is a **monorepo**: a FastAPI backend (Postgres + Redis + Celery + Playwright)
and a React/Vite frontend.

## Status

Built in phases. **Phase 1 (foundation)** is in place: infrastructure, backend
core (config, DB, JWT/security, Redis, logging), and the FastAPI app factory.
Subsequent phases add data models + auth, the audit queue, the browser/analysis
engine, the AI layer, and the frontend.

## Requirements

- Docker + Docker Compose
- (For local frontend work) Node 18+

## Quick start

```bash
# 1. configure
cp .env.example .env
python -c "import secrets; print(secrets.token_urlsafe(48))"   # paste into SECRET_KEY

# 2. boot the foundation (db + redis + api)
docker compose up -d db redis api
#   or: make up

# 3. verify
curl http://localhost:8000/health
open http://localhost:8000/docs
```

The API runs at `http://localhost:8000`. Celery worker/beat are defined but
held behind the `workers` compose profile until Phase 3
(`docker compose --profile workers up`).

## Layout

```
backend/app/
  core/      config, database, security, redis, logging
  models/    SQLAlchemy models           (Phase 2)
  schemas/   Pydantic DTOs               (Phase 2)
  api/v1/    routers                     (Phase 2+)
  services/  auth, audit, crawler, ai…   (Phase 2+)
  workers/   celery app + tasks          (Phase 3)
frontend/    React + Vite                (Phase 6+)
```
