# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start all packages in watch mode (hot-reload)
pnpm start            # Start the API server (production mode)
pnpm build            # Build all workspace packages
pnpm build:watch      # Build with watch mode

# Code quality
pnpm lint             # Run ESLint across the entire project
pnpm format           # Format code with Prettier

# Database
pnpm migration:run    # Run pending TypeORM migrations
```

No test framework is configured yet.

## Architecture: Hexagonal (Ports & Adapters)

This is a **pnpm monorepo** implementing Hexagonal Architecture with strict layer separation:

```
domain/         → models (interfaces) + ports (in/out interfaces)
application/    → usecase services (business logic implementing in-ports)
infra/
  api/          → Express HTTP server, routes, middleware
  helper/       → Dependency injection containers
  driven-adapters/
    persistence/ → TypeORM entities + repository adapters (out-ports)
    ai/          → AI service adapter (stub)
    engine/      → Engine service adapter (stub)
```

**Key rule:** Domain and application layers have zero infrastructure dependencies. Only `infra/` imports from external libraries (TypeORM, Express, etc.).

### Dependency Injection

Two singleton injectors in `infra/helper/`:
- `OutPortInjector` — registers repository/adapter instances
- `UseCaseInjector` — registers use case service instances

Routes obtain services via `inject(InPortType.OrganizationUseCase)`. Wiring happens at startup in the injector files.

### Entity vs. Model separation

- **Domain models** (`domain/models/`) — plain TypeScript interfaces (no decorators)
- **TypeORM entities** (`infra/driven-adapters/persistence/`) — decorated DB classes
- Repository adapters map between the two

### Error handling

Custom domain errors: `DataError`, `NotFoundError`, `AccessError`, `UnauthorizedError`.
Express route handlers use `.catch(next)`; the error middleware maps domain errors to HTTP status codes.

## Workspace Packages

| Package path | Workspace name |
|---|---|
| `domain/models` | `@insight-ai/domain-models` |
| `domain/ports` | `@insight-ai/domain-ports` |
| `application/usecase` | `@insight-ai/usecase` |
| `infra/api` | `@insight-ai/api` |
| `infra/helper` | `@insight-ai/helper` |
| `infra/driven-adapters/persistence` | `@insight-ai/persistence` |

Packages reference each other via the `workspace:*` protocol in `package.json`.

## Database

- PostgreSQL 16 via TypeORM 0.3.28
- `synchronize: false` — always use migrations, never rely on auto-sync
- Entities are auto-discovered by glob: `**/*Entity.{ts,js}`
- Migrations live in `infra/driven-adapters/persistence/src/migrations/`

Required environment variables (see `.env.example`):
```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
NODE_ENV, DB_LOGGING
```

## Key Conventions

- **IDs**: `crypto.randomUUID()` — all entities use UUID primary keys
- **Permissions**: String codes in `{Resource}:{Action}` format
- **Pagination**: `Page<T>` interface with `{ items, total, hasNext, totalPages }`
- **Session**: Express `Request` is extended with `session?: SessionData` and `transaction?: { transactionId }`
- **Timestamps**: All TypeORM entities include `createdAt` / `updatedAt` columns
- **No floating promises**: ESLint warns on unhandled promises — always `await` or `.catch()`
