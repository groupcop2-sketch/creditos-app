import React, { useMemo, useState } from 'react';
import { KeyRound, Plus, Search, X } from 'lucide-react';
import type { PermissionRow } from '../api';
import { GRUPOS, norm } from './RolePermissionsEditor';

type Props = {
  permissions: PermissionRow[];
  /** "Create permission" form owned by App. */
  createForm: React.ReactNode;
};

/** Read-only catalog of permissions grouped by area, same layout as the roles screen. */
export const PermissionsCatalog: React.FC<Props> = ({ permissions, createForm }) => {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const grupos = useMemo(() => {
    const usados = new Set<number>();
    return GRUPOS.map((g) => {
      const items = permissions
        .filter((p) => !usados.has(p.id) && g.match(p.nombre))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      items.forEach((p) => usados.add(p.id));
      return { ...g, items };
    }).filter((g) => g.items.length);
  }, [permissions]);

  const q = norm(query.trim());
  const visibles = grupos
    .map((g) => ({ ...g, items: q ? g.items.filter((p) => norm(`${p.descripcion} ${p.nombre}`).includes(q)) : g.items }))
    .filter((g) => g.items.length);

  return (
    <div className="roles-layout">
      <aside className="roles-aside" aria-label="Resumen de permisos">
        <header>
          <div><h2>Permisos</h2><small>{permissions.length} en {grupos.length} áreas</small></div>
          <button type="button" className="roles-new-btn" aria-expanded={creating} onClick={() => setCreating((v) => !v)}>
            {creating ? <><X size={14} aria-hidden="true" /> Cerrar</> : <><Plus size={14} aria-hidden="true" /> Nuevo</>}
          </button>
        </header>
        {creating && (
          <div className="roles-create">
            {createForm}
            <p className="perms-help">Usa el formato <code>modulo:accion</code>. Un permiso nuevo no hace nada hasta que el sistema lo use y se asigne a un rol en la pestaña Roles.</p>
          </div>
        )}
        <ul className="perms-index">
          {grupos.map((g) => {
            const Icon = g.icon;
            return (
              <li key={g.titulo}>
                <a href={`#perm-${norm(g.titulo).replace(/\W+/g, '-')}`}>
                  <span className="roles-group-icon" aria-hidden="true"><Icon size={14} /></span>
                  <span>{g.titulo}</span>
                  <span className="roles-group-count">{g.items.length}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="roles-editor" aria-label="Catálogo de permisos">
        <header className="roles-editor-head">
          <div>
            <span className="section-kicker">Catálogo</span>
            <h2>Permisos del sistema</h2>
            <div className="roles-chips"><span>Se asignan a los roles en la pestaña Roles</span></div>
          </div>
          <label className="roles-search">
            <Search size={15} aria-hidden="true" />
            <input type="search" placeholder="Buscar por código o descripción…" aria-label="Buscar permiso" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </header>

        <div className="roles-groups">
          {!visibles.length && <p className="muted-note">Ningún permiso coincide con «{query}».</p>}
          {visibles.map((g) => {
            const Icon = g.icon;
            return (
              <article key={g.titulo} className="roles-group" id={`perm-${norm(g.titulo).replace(/\W+/g, '-')}`}>
                <header>
                  <span className="roles-group-icon" aria-hidden="true"><Icon size={16} /></span>
                  <div><h3>{g.titulo}</h3>{g.ayuda && <p>{g.ayuda}</p>}</div>
                  <span className="roles-group-count">{g.items.length}</span>
                </header>
                <ul>
                  {g.items.map((p) => (
                    <li key={p.id} className="perms-row">
                      <KeyRound size={14} aria-hidden="true" />
                      <span className="roles-perm-text">
                        <strong>{p.descripcion || p.nombre}</strong>
                        <code>{p.nombre}</code>
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
