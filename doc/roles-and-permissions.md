# Roles y permisos

Este backend modela autorizacion por organizacion, con roles jerarquicos y permisos asociados a recursos concretos. El objetivo es controlar quien puede administrar organizaciones, roles, datasources y reportes dentro de cada tenant.

## Entidades y recursos reales

Las entidades que participan en este flujo son:

- `User`: identidad global del usuario.
- `Organization`: tenant o espacio de trabajo.
- `Member`: relacion entre `User` y `Organization`.
- `Role`: rol asignado dentro de una organizacion.
- `RoleMember`: relacion entre `Member` y `Role`.
- `Datasource`: conexion a una base real perteneciente a una organizacion.
- `Report`: reporte generado sobre un datasource.
- `Permission`: privilegio granular asociado a un rol.

## Recursos autorizables

El sistema usa `Resource` para agrupar permisos por tipo de objeto:

- `org` → organizaciones
- `role` → roles
- `ds` → datasources
- `inf` → reportes

La entidad `Report` se representa con el prefijo `inf` en los codigos de permiso.

## Formato de permisos

Un permiso se expresa como `recurso:accion`.

Ejemplos:

- `org:edit`
- `role:assign`
- `ds:read`
- `inf:delete`

Tambien existen acciones de nivel superior:

- `manage`
- `admin`

Estas acciones se expanden segun la tabla `PERMISSION_COVERS`.

## Cobertura de permisos

Los permisos de alto nivel agrupan otros permisos:

- `ds:manage` cubre lectura y operacion sobre un datasource y sus reportes.
- `ds:admin` amplifica `ds:manage` y ademas permite borrar el datasource.
- `org:manage` cubre edicion, creacion y gestion de miembros.
- `org:admin` cubre `org:manage` mas gobierno completo de roles y recursos.

La validacion de acceso considera esa expansion al evaluar `hasPermission(...)` y `hasRolePermission(...)`.

## Scope o alcance

Un permiso puede ser global o estar acotado a un recurso especifico:

- `datasourceId` para permisos sobre un datasource.
- `reportId` para permisos sobre un reporte.
- sin scope, el permiso aplica al ambito de la organizacion.

Reglas importantes:

- un permiso no puede tener `datasourceId` y `reportId` al mismo tiempo;
- los permisos `ds:*` pueden quedar limitados a un datasource concreto;
- los permisos `inf:*` pueden quedar limitados a un reporte concreto.

## Jerarquia de roles

Los roles forman una cadena jerarquica dentro de la organizacion.

- Existe un rol raiz o top-level.
- No se puede modificar ni eliminar ese rol raiz.
- La jerarquia se usa para calcular nivel de acceso.
- Un usuario no puede modificar roles por encima de su nivel efectivo.

El nivel se obtiene siguiendo `parentRoleId` en `Role`.

## Reglas de negocio principales

### Creacion de roles

Para crear un rol se requiere pertenencia a la organizacion y uno de estos permisos:

- `role:create`
- `org:admin`

Ademas:

- el rol padre debe pertenecer a la misma organizacion;
- el nuevo rol no puede quedar por encima del nivel del actor;
- los permisos opcionales del rol se validan contra la organizacion y los datasources accesibles.

### Edicion de roles

Para editar un rol se requiere:

- pertenecer a la organizacion;
- `role:edit` o `org:admin`.

Tambien se impone que:

- no se pueda editar el rol raiz;
- no se pueda editar un rol por encima del nivel del actor;
- no se pueda modificar permisos del rol con mayor acceso del propio usuario.

### Eliminacion de roles

Para borrar un rol se requiere:

- `role:delete` o `org:admin`;
- que el rol no sea el raiz;
- que no tenga miembros asignados;
- que no este por encima del nivel del actor.

Si el rol tiene un hijo, la relacion se reacomoda temporalmente antes de borrar.

### Asignacion de miembros

Para agregar un miembro a una organizacion y asignarle rol se requiere:

- `role:assign` o `org:add_member`;
- el correo debe ser valido;
- el rol debe pertenecer a la organizacion;
- el rol asignado debe quedar por debajo del nivel del actor.

### Remocion de miembros

Para remover un miembro se requiere:

- `org:remove_member` o `org:admin`;
- no intentar removerse a uno mismo;
- no remover a alguien con mayor nivel que el actor.

## Creacion de la organizacion

Cuando se crea una organizacion, el sistema:

1. crea la `Organization`;
2. agrega al usuario como `Member`;
3. crea el rol `Admin`;
4. asigna al rol todos los permisos de administracion inicial;
5. vincula al miembro con ese rol.

Eso garantiza que cada tenant nazca con un punto de control administrativo.

## Evaluacion de acceso

La verificacion de permisos se hace en dos niveles:

- por rol, con `hasRolePermission(...)`;
- por usuario dentro de una organizacion, con `hasPermission(...)`.

Ademas, la capa de persistencia calcula permisos accesibles por:

- `memberId`;
- `organizationId`;
- `datasourceId` o `reportId`, segun corresponda.

## Resumen operativo

- `Organization` define el tenant.
- `Member` une usuario y tenant.
- `Role` define posicion jerarquica y conjunto de permisos.
- `Permission` define capacidad concreta sobre `org`, `role`, `ds` o `inf`.
- `RoleMember` asigna el rol al miembro.
- `Datasource` y `Report` son los recursos protegidos principales.
