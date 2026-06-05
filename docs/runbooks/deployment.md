# Runbook — Deployment

## Pipelines
- CI: ver `.github/workflows/` — `agentic setup-ci` genera los workflows base.
- CD: el job de deploy se dispara en `main` tras governance check verde.

## Rollback
- `git revert` del commit merged + re-run del pipeline.
- El registro queda en `pull_requests.is_rollback` (TLM).

## Responsables
- Tech Lead aprueba cambios de infra.
- Owner aprueba cambios de compliance.
