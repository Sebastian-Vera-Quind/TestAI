# Non-Functional Requirements

> Generado por Guardian Suite (FACTORY-30). Fuente: TLM.

| Atributo | Valor |
| --- | --- |
| security | {'description': 'The system implements a robust authorization model with hierarchical roles and granular permissions scoped to organizations, datasources, and reports. It includes explicit rules for role management, member assignment, and access evaluation using `hasRolePermission` and `hasPermission` functions. UUIDs are used for primary keys, and specific error types (`AccessError`, `UnauthorizedError`) are defined for security-related failures.'} |
| performance | {'description': "The system uses dependency injection with caching for use cases and adapters, which implies performance considerations by reusing instances and reducing object creation overhead. The 'no floating promises' rule also contributes to stable execution."} |
| scalability | {'description': 'The backend is designed as a multitenant application, requiring the system to handle multiple organizations and users, which inherently implies scalability requirements. The use of Docker and PostgreSQL 16 also supports scalable deployments.'} |
| availability | {'description': 'The project follows Gitflow with `main` and `release` branches for stable deployments, indicating a focus on delivering reliable versions, which indirectly supports availability.'} |
| maintainability | {'description': 'The architecture is explicitly hexagonal with strict separation of domain, application, and infrastructure layers to ensure the system is easy to maintain, test, and extend. TypeScript, pnpm workspaces, Zod, Pino, and Swagger UI contribute to code quality and documentation. Strict code quality rules (ESLint, no disabled rules, focused changes, clear naming) and a defined Gitflow process with mandatory pre-PR validations are enforced to ensure high code quality and maintainability.'} |
