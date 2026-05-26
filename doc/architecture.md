# Arquitectura

Insight AI Backend sigue una arquitectura hexagonal con separación estricta entre dominio, aplicación e infraestructura. La idea es mantener la lógica de negocio aislada de los detalles técnicos para que el sistema sea más fácil de mantener, probar y extender.

## Capas

### Dominio
La capa de dominio vive en `domain/` y contiene los modelos y puertos del negocio. Aquí no debe existir dependencia de Express, TypeORM ni otros detalles de infraestructura.

### Aplicación
La capa de aplicación vive en `application/` y concentra los casos de uso. Su responsabilidad es orquestar reglas de negocio y coordinar dependencias a través de puertos definidos en el dominio.

### Infraestructura
La capa de infraestructura vive en `infra/` y contiene:
- `infra/api/` para la API HTTP, rutas y middlewares.
- `infra/driven-adapters/persistence/` para los repositorios e integracion con TypeORM.
- `infra/helper/` para la inyección de dependencias.
- `infra/driven-adapters/ai/` y `infra/driven-adapters/engine/` para adaptadores externos.

## Reglas de comunicación entre capas

La comunicación debe seguir estas reglas:

- El dominio no importa nada de aplicación ni infraestructura.
- La aplicación puede depender del dominio, pero no de Express, TypeORM ni implementaciones concretas.
- La infraestructura puede depender de dominio y aplicación para conectar adaptadores y exponer interfaces, pero no al revés.
- Las rutas HTTP solo deben resolver casos de uso y delegar la lógica real a la capa de aplicación.
- Los repositorios concretos se consumen a través de puertos, nunca directamente desde la lógica de negocio.
- Los errores de negocio deben viajar como errores de dominio y luego mapearse en la capa HTTP.

## Inyección de dependencias

La inyección está centralizada en `infra/helper/` mediante dos contenedores singleton:

- `OutPortInjector` crea y reutiliza adaptadores concretos para puertos de salida.
- `UseCaseInjector` crea y reutiliza casos de uso para puertos de entrada.

El helper `inject(...)` decide si la solicitud corresponde a un puerto de entrada o salida y retorna la instancia adecuada.

### Flujo de resolución

1. La API o una ruta pide una dependencia usando `inject(InPortType.X)` o `inject(OutPortType.Y)`.
2. Si la dependencia ya existe en memoria, el inyector devuelve la instancia cacheada.
3. Si no existe, se crea con su factory correspondiente.
4. Los casos de uso reciben repositorios concretos por constructor, pero solo conocen sus contratos.

### Reglas prácticas

- No instanciar repositorios o casos de uso directamente en las rutas.
- No duplicar factories fuera de `infra/helper/`.
- Mantener los constructores de casos de uso explícitos para que las dependencias sean trazables.
- Agregar nuevas dependencias primero en el dominio o puertos, luego en el inyector y por último en la capa que las consume.

## Punto de entrada HTTP

La API se inicializa desde `infra/api/src/index.ts`. Ese archivo monta middlewares globales, registra las rutas principales, expone Swagger cuando `GENERATE_OPENAPI_DOCS=true` y deja el manejo de errores al middleware final.

## Resumen operativo

El flujo general es:

- HTTP entra por `infra/api/`.
- Las rutas resuelven un caso de uso con `inject(...)`.
- El caso de uso usa puertos de salida para hablar con persistencia u otros adaptadores.
- La respuesta regresa por la misma cadena hasta la API.
