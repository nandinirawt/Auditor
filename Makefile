# UXSense — developer commands
.PHONY: help env up up-workers down logs ps build migrate makemigration worker beat shell test

help:
	@echo "UXSense"
	@echo "  make env            create .env from .env.example"
	@echo "  make up             start db + redis + api"
	@echo "  make up-workers     start everything incl. celery worker + beat"
	@echo "  make down           stop all services"
	@echo "  make logs           tail logs"
	@echo "  make build          rebuild images"
	@echo "  make migrate        apply DB migrations (Phase 2+)"
	@echo "  make makemigration m='message'   create a migration (Phase 2+)"
	@echo "  make shell          open a python shell in the api container"

env:
	@test -f .env || cp .env.example .env && echo ".env ready (edit SECRET_KEY + API keys)"

up:
	docker compose up -d db redis api

up-workers:
	docker compose --profile workers up -d

down:
	docker compose down

logs:
	docker compose logs -f

ps:
	docker compose ps

build:
	docker compose build

migrate:
	docker compose run --rm api alembic upgrade head

makemigration:
	docker compose run --rm api alembic revision --autogenerate -m "$(m)"

worker:
	docker compose --profile workers up worker

beat:
	docker compose --profile workers up beat

shell:
	docker compose run --rm api python

test:
	docker compose run --rm api pytest -q
