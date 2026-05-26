# AGENTS.md

> Compact agent context. Detalles completos en `docs/`. Generado por Guardian Suite (FACTORY-30).

**Stack**: Express 5 / TypeScript / Node.js 22 / pnpm

<architecture-constraints>
## Dominio
Insight AI Backend is a multi-tenant AI-powered application backend designed to generate reports from real database information using natural language as a query interface. Its objective is to…

_Detalle: [`docs/architecture.md`](docs/architecture.md)._
</architecture-constraints>


<framework-rules>
## Working contract
1. **Empezar**: invocá la MCP tool `tlm_start_use_case(project_code, use_case_id)` para marcar el UC como `in_progress`.
2. **Escribir**: respetá `docs/standards.md`, `docs/patterns.md` y `docs/constraints.md` (cuando exista). Tras cada Edit/Write llamá `tlm_record_ai_attributions` (ver sección AI Attribution).
3. **Cerrar**:
   a) Corré `agentic check --json` y leé el campo `.governance_score` del output.
   b) Llamá `tlm_finish_use_case(..., governance_score=<score>)`.
   c) Si TLM retorna `SCORE_BELOW_THRESHOLD`: corregí violations y volvé a (a).

## Estándares clave (top-5)
- (sin estándares registrados)

_Listado completo: [`docs/standards.md`](docs/standards.md)._

## Patrones clave (top-5)
- (sin patrones registrados)

_Listado completo: [`docs/patterns.md`](docs/patterns.md)._
</framework-rules>

<quality-gate>
## Quality gate
Governance score mínimo **60/100**. Validar con `agentic check`.
</quality-gate>

## AI Attribution via MCP

Después de cada Edit/Write significativo a código, llamá la MCP tool `tlm_record_ai_attributions` con `project_code="NODE-MONO"`. Header: `X-API-Key` (obtené con `agentic mcp-key --print`).

```json
{
  "project_code": "NODE-MONO",
  "commit_sha": null,
  "attributions": [
    {
      "file_path": "src/foo.py", "line_start": 12, "line_end": 14,
      "generator": "claude-code", "model": "claude-opus-4-7"
    }
  ]
}
```

Schema completo y notas en [`docs/attribution.md`](docs/attribution.md).

## Pointers
Documentos referenciados:
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/structure.md`](docs/structure.md)
- [`docs/nfr.md`](docs/nfr.md)
- [`docs/environments.md`](docs/environments.md)
