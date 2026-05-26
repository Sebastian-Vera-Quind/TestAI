# Insight AI Backend

Insight AI es el backend de una aplicación multitenant basada en IA para generar reportes a partir de información real de bases de datos, usando lenguaje natural como interfaz de consulta. El objetivo del sistema es conectar datos operativos con una experiencia conversacional que permita explorar, resumir y transformar información en reportes útiles para cada tenant.

El proyecto está organizado como un monorepo TypeScript con arquitectura hexagonal. La capa de dominio contiene los modelos y puertos, la capa de aplicación concentra los casos de uso, y la infraestructura implementa la API HTTP, la persistencia y los adaptadores externos.

## Stack tecnológico

- Node.js 22
- TypeScript
- pnpm workspaces
- Express 5
- TypeORM 0.3
- PostgreSQL 16
- Zod para validación y esquemas
- Pino para logging
- Swagger UI para documentación de la API
- Docker y Docker Compose para entorno local

## Estructura general

- `domain/` contiene los modelos de dominio y los puertos.
- `application/` contiene los casos de uso.
- `infra/api/` expone la API HTTP y los middlewares.
- `infra/driven-adapters/persistence/` implementa la persistencia con TypeORM.
- `infra/helper/` centraliza la inyección de dependencias.
- `iac/` contiene infraestructura como código.

## Requisitos previos

- Node.js 22 o superior
- pnpm 10
- Docker y Docker Compose
- PostgreSQL 16, si no se usa el contenedor local

## Variables de entorno

Copia el archivo de ejemplo y ajusta los valores según tu entorno:

```bash
cp .env.example .env
```

Remplaza las variables con las credenciales y configuraciones adecuadas, especialmente las relacionadas con la conexión a la base de datos.

## Desarrollo local

1. Instala dependencias.

```bash
pnpm install
```

2. Levanta PostgreSQL con Docker Compose.

```bash
docker compose up -d postgres
```

3. Si necesitas preparar el esquema de base de datos, construye primero los paquetes y ejecuta las migraciones.

```bash
pnpm build
pnpm migration:run
```

4. Arranca el backend en modo desarrollo.

```bash
pnpm dev
```

Por defecto, la API usa el puerto definido en `.env` y expone la documentación OpenAPI cuando `GENERATE_OPENAPI_DOCS=true`.

## Comandos útiles

- `pnpm dev`: inicia la API en modo watch con recarga automática.
- `pnpm build`: compila todos los paquetes del monorepo.
- `pnpm start`: ejecuta la API en modo producción.
- `pnpm lint`: ejecuta ESLint sobre el proyecto.
- `pnpm format`: formatea el código con Prettier.
- `pnpm migration:run`: ejecuta las migraciones pendientes de TypeORM.

## Notas de arquitectura

Este backend sigue una separación estricta entre dominio, aplicación e infraestructura. La idea es mantener la lógica de negocio aislada de detalles técnicos como HTTP, base de datos y proveedores externos, para facilitar mantenimiento, pruebas y evolución hacia nuevos canales o integraciones.