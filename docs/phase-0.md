# Fase 0 - Base del proyecto

## Objetivo

Dejar una base tecnica limpia antes de construir los modulos de negocio de la aplicacion de creditos.

## Stack actual

- Monorepo npm con workspaces en `apps/*`.
- API: Fastify, TypeScript, PostgreSQL, Zod, JWT y bcrypt.
- Web: React, Vite y TypeScript.
- Base local: PostgreSQL, base `P&S`, esquema `"Creditos"`.

## Estado encontrado

La API ya tiene un modulo inicial de seguridad contra tablas reales del esquema `"Creditos"`:

- `TBL_USUARIOS`
- `TBL_ROLES`
- `TBL_PERMISOS`
- `TBL_USUARIO_ROLES`
- `TBL_MODULOS`
- `TBL_SUB_MODULOS`
- `TBL_ROL_SUBMODULO_PERMISO`

La base tambien contiene tablas de negocio que sirven como punto de partida:

- Clientes: `TBL_CLIENTES`
- Creditos: `TBL_CREDITOS`
- Documentos de credito: `TBL_DOCUMENTOS_CREDITOS`
- Movimientos de credito: `TBL_MOVIMIENTOS_CREDITOS`
- Inversionistas: `TBL_INVERSIONISTAS`
- Inversiones: `TBL_INVERSIONES`
- Bancos y cuentas: `TBL_BANCOS`, `TBL_BANCO_PERSONAS`
- Afianzadores: `TBL_AFIANZADORES`, `TBL_REP_LEGAL_AFIANZADORES`
- Catalogos: estados, tipos de credito, ciudades, departamentos, tipos de documento, bancos, monedas, etc.

## Hallazgos a resolver antes de crecer

1. No hay una entidad clara para pagadurias.
   Para libranzas y descuentos de nomina/prima se necesita modelar empresas pagadoras, convenios y empleados asociados.

2. `TBL_CREDITOS.v_cliente` no aparece como llave foranea a `TBL_CLIENTES`.
   El modelo deberia tener una relacion clara `credito -> cliente/deudor`.

3. La columna `TBL_USUARIOS.v_contraseña` existe con `ñ`.
   Funciona si se cita correctamente, pero es fragil para herramientas, consola y migraciones. Mas adelante conviene migrar a un nombre ASCII como `v_contrasena_hash`.

4. El frontend esta concentrado en `App.tsx`.
   Para una aplicacion grande hay que separar paginas, componentes, hooks, cliente API y modulos por dominio.

5. La API concentra mucho SQL de seguridad en un solo servicio.
   Conviene mantener el avance modular: `routes`, `service`, `repository`, `schemas` y `types` por modulo cuando el dominio crezca.

## Modulos objetivo

1. Seguridad
   Usuarios, roles, permisos, modulos, sesion y proteccion por permisos.

2. Catalogos
   Estados, tipos de identificacion, tipos de credito, ciudades, departamentos, bancos y tipos de cuenta.

3. Terceros
   Clientes, beneficiarios, comerciales, inversionistas, representantes legales y empleados.

4. Pagadurias
   Empresas pagadoras, convenios, empleados cargados, cupos y tipo de descuento.

5. Creditos
   Solicitud, estudio, aprobacion, desembolso, documentos, plan de pagos y estado.

6. Cartera
   Pagos, abonos, descuentos aplicados, mora, saldo pendiente y movimientos.

7. Inversionistas
   Capital, inversiones, participacion en creditos, rendimientos y pagos.

8. Reportes
   Cartera activa, cartera vencida, flujo esperado, rentabilidad y reportes por pagaduria/comercial.

## Decisiones de fase 0

- No cambiar todavia el modelo de datos productivo sin una migracion explicita.
- Mantener Fastify y React como base.
- Corregir primero build, configuracion y documentacion.
- El primer modulo funcional nuevo deberia ser Pagadurias, pero despues de cerrar seguridad y catalogos basicos.

## Siguiente fase recomendada

Fase 1 debe dejar listo el modulo de Seguridad como base reusable:

- Login robusto.
- Bootstrap de primer administrador.
- Usuarios con roles.
- Roles con permisos.
- Middleware de permisos.
- UI separada por paginas/componentes.
- Catalogo de modulos/submodulos usable para menu lateral.
