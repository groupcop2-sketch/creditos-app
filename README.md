# Creditos App

Monorepo para una plataforma de manejo de creditos, pagadurias, inversionistas, beneficiarios, comerciales, usuarios, roles y permisos.

## Estructura

- `apps/api`: backend en TypeScript con Fastify y PostgreSQL
- `apps/web`: frontend en React + Vite

## Arranque local

1. Copia `.env.example` a `.env` y ajusta la cadena de conexion.
2. Instala dependencias con `npm install`.
3. Levanta la API con `npm run dev:api`.
4. Levanta el front con `npm run dev:web`.
5. Abre el navegador en `http://localhost:5174`.

## Conexion local

La API lee variables separadas para PostgreSQL:

- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

Esto evita problemas con nombres de base de datos como `P&S` dentro de una URL.

## Siguiente paso

La fase 0 del proyecto esta documentada en `docs/phase-0.md`.

El siguiente paso tecnico recomendado es cerrar el modulo de Seguridad y luego construir Catalogos y Pagadurias como primeros modulos de negocio.
