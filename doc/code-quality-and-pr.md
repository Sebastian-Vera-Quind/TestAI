# Code Quality y Flujo de PR

Este proyecto aplica una disciplina de calidad orientada a mantener el monorepo consistente, seguro de modificar y facil de revisar. La validacion interna de cada PR prioriza que no existan errores de ESLint antes de aprobar cambios.

## Principios de calidad

- La correccion debe preferirse sobre el atajo.
- No se deben deshabilitar reglas de ESLint para hacer pasar un cambio.
- Si una regla bloquea una implementacion, primero se debe corregir la causa raiz.
- Solo se acepta una desactivacion de regla cuando exista una justificacion puntual, acotada y entendible para revision.
- Los cambios deben preservar la separacion entre dominio, aplicacion e infraestructura.
- No se deben introducir promesas flotantes, dependencias ocultas ni acoplamientos nuevos entre capas.

## Reglas de ESLint

La verificacion de PR considera ESLint como control obligatorio.

- Si ESLint reporta errores, la PR no debe considerarse lista para merge.
- No usar comentarios de deshabilitacion como solucion permanente.
- Si existe un caso limite, acotar la excepcion al bloque minimo posible y documentarla en el cambio.
- Preferir refactorizar el codigo para cumplir la regla en lugar de excluir el archivo o la linea.

## Flujo antes de abrir una PR

1. Partir siempre desde `develop`.
2. Crear una rama nueva con formato `feature/**`.
3. Implementar el cambio siguiendo las reglas de capa y calidad.
4. Ejecutar validaciones locales antes de abrir la PR.
5. Revisar el diff completo para confirmar que no haya ruido innecesario.
6. Abrir la PR apuntando a `develop`.

## Validaciones previas recomendadas

Antes de pedir revision, el cambio debe pasar como minimo por estas revisiones:

- `pnpm lint`
- `pnpm build` cuando el cambio afecte compilacion o tipos
- `pnpm migration:run` cuando se incluyan cambios de persistencia que requieran migracion

Si una validacion falla, se corrige antes de abrir la PR. La idea es que la revision humana no actue como primer filtro de errores mecanicos.

## Gitflow

El proyecto sigue Gitflow con estas ramas principales:

- `main`: version estable y lista para despliegue.
- `release`: preparacion de una entrega estable.
- `develop`: integracion continua de trabajo en curso.
- `feature/**`: ramas de desarrollo por funcionalidad o ajuste puntual.

## Flujo de ramas

- El trabajo diario nace en `feature/**`.
- Las PR de funcionalidad deben ir hacia `develop`.
- `release` se usa para estabilizar una entrega antes de llegar a `main`.
- `main` conserva el estado listo para produccion.

## Criterios para aprobar una PR

Una PR debe llegar con el menor riesgo posible:

- Sin errores de ESLint.
- Sin reglas deshabilitadas salvo excepcion justificada.
- Con cambios enfocados y faciles de revisar.
- Con nombres y estructura alineados con el monorepo.
- Con impacto claro en el comportamiento esperado.

## Recomendacion practica

Si aparece la necesidad de deshabilitar una regla, detenerse y revisar el diseno antes de continuar. En este proyecto la norma es ajustar el codigo para cumplir el contrato de calidad, no debilitar la validacion.
