import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Handshake, KeyRound, Layers, Plus, Search, ShieldCheck, Sparkles, Users, Wallet, Workflow, X } from 'lucide-react';
import { api, type PermissionRow, type RoleRow } from '../api';

type Props = {
  token: string;
  roles: RoleRow[];
  permissions: PermissionRow[];
  /** "Create role" form owned by App; shown when the user clicks "Nuevo rol". */
  createForm: React.ReactNode;
  formatMoney: (value: number | null | undefined) => string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
};

export type Grupo = { titulo: string; ayuda?: string; icon: React.ElementType; match: (code: string) => boolean };

export const GRUPOS: Grupo[] = [
  { titulo: 'Etapas del crédito', ayuda: 'Quién trabaja cada etapa: aprobar, devolver, rechazar y sus acciones.', icon: Workflow, match: (c) => c.startsWith('creditos:etapa-') },
  { titulo: 'Créditos y productos', icon: Wallet, match: (c) => /^(creditos|productos-creditos):/.test(c) },
  { titulo: 'Empresas y empleados', icon: Building2, match: (c) => c.startsWith('empresas:') },
  { titulo: 'Aliados y comerciales', icon: Handshake, match: (c) => /^(aliados|comerciales|libranzeras):/.test(c) },
  { titulo: 'Socios e inversiones', icon: Users, match: (c) => c.startsWith('socios:') },
  { titulo: 'Seguridad', icon: KeyRound, match: (c) => /^(auth|usuarios|roles|permisos|modulos|submodulos):/.test(c) },
  { titulo: 'Plataforma', ayuda: 'Solo para el proveedor del software.', icon: Sparkles, match: (c) => c.startsWith('superadmin:') },
  { titulo: 'Acciones generales', icon: Layers, match: () => true }
];

export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sameSet = (a: Set<number>, b: Set<number>) => a.size === b.size && [...a].every((x) => b.has(x));

/** Roles list + permission editor. Starts from the role's current permissions, so saving never drops unseen ones. */
export const RolePermissionsEditor: React.FC<Props> = ({ token, roles, permissions, createForm, formatMoney, notify }) => {
  const [roleId, setRoleId] = useState<number | null>(null);
  const [original, setOriginal] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (roleId === null && roles.length) setRoleId(roles[0].id);
  }, [roles, roleId]);

  useEffect(() => {
    if (!roleId) return;
    setLoading(true);
    api.getRolePermissions(token, roleId)
      .then((rows) => { const s = new Set(rows.map((r) => r.id)); setOriginal(s); setSelected(new Set(s)); })
      .catch((e) => notify(e instanceof Error ? e.message : 'No se pudieron cargar los permisos del rol', 'error'))
      .finally(() => setLoading(false));
  }, [token, roleId]);

  const grupos = useMemo(() => {
    const usados = new Set<number>();
    return GRUPOS.map((g) => {
      const items = permissions.filter((p) => !usados.has(p.id) && g.match(p.nombre));
      items.forEach((p) => usados.add(p.id));
      return { ...g, items };
    }).filter((g) => g.items.length);
  }, [permissions]);

  const q = norm(query.trim());
  const visibles = grupos
    .map((g) => ({ ...g, items: q ? g.items.filter((p) => norm(`${p.descripcion} ${p.nombre}`).includes(q)) : g.items }))
    .filter((g) => g.items.length);

  const dirty = !sameSet(original, selected);
  const role = roles.find((r) => r.id === roleId);

  const elegirRol = (id: number) => {
    if (id === roleId) return;
    if (dirty && !window.confirm('Hay cambios sin guardar en este rol. ¿Descartarlos?')) return;
    setRoleId(id);
  };

  const toggle = (id: number) => setSelected((cur) => {
    const next = new Set(cur);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleGrupo = (ids: number[], on: boolean) => setSelected((cur) => {
    const next = new Set(cur);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    return next;
  });

  const guardar = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      await api.updateRolePermissions(token, roleId, Array.from(selected));
      setOriginal(new Set(selected));
      notify('Permisos del rol actualizados. Los usuarios deben volver a iniciar sesión para verlos.', 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudieron actualizar los permisos', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="roles-layout">
      <aside className="roles-aside" aria-label="Roles">
        <header>
          <div><h2>Roles</h2><small>{roles.length} configurados</small></div>
          <button type="button" className="roles-new-btn" aria-expanded={creating} onClick={() => setCreating((v) => !v)}>
            {creating ? <><X size={14} aria-hidden="true" /> Cerrar</> : <><Plus size={14} aria-hidden="true" /> Nuevo rol</>}
          </button>
        </header>
        {creating && <div className="roles-create">{createForm}</div>}
        <ul className="roles-list">
          {roles.map((r) => (
            <li key={r.id}>
              <button type="button" className={r.id === roleId ? 'active' : ''} aria-current={r.id === roleId} onClick={() => elegirRol(r.id)}>
                <span className="roles-avatar" aria-hidden="true">{r.nombre.trim().slice(0, 2).toUpperCase()}</span>
                <span className="roles-info">
                  <strong>{r.nombre}</strong>
                  {r.descripcion && r.descripcion !== r.nombre && <small>{r.descripcion}</small>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="roles-editor" aria-label="Permisos del rol">
        {!role ? (
          <div className="roles-empty"><ShieldCheck size={32} aria-hidden="true" /><p>Selecciona un rol para ver y editar sus permisos.</p></div>
        ) : (
          <>
            <header className="roles-editor-head">
              <div>
                <span className="section-kicker">Permisos del rol</span>
                <h2>{role.nombre}</h2>
                <div className="roles-chips">
                  <span>{selected.size} de {permissions.length} permisos</span>
                  <span>Límite de aprobación: {role.montoMaximoAprobacion === null ? 'Sin límite' : formatMoney(role.montoMaximoAprobacion)}</span>
                </div>
              </div>
              <label className="roles-search">
                <Search size={15} aria-hidden="true" />
                <input type="search" placeholder="Buscar permiso…" aria-label="Buscar permiso" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            </header>

            {loading ? <p className="muted-note">Cargando permisos del rol…</p> : (
              <div className="roles-groups">
                {!visibles.length && <p className="muted-note">Ningún permiso coincide con «{query}».</p>}
                {visibles.map((g) => {
                  const ids = g.items.map((p) => p.id);
                  const activos = ids.filter((id) => selected.has(id)).length;
                  const Icon = g.icon;
                  return (
                    <article key={g.titulo} className="roles-group">
                      <header>
                        <span className="roles-group-icon" aria-hidden="true"><Icon size={16} /></span>
                        <div><h3>{g.titulo}</h3>{g.ayuda && <p>{g.ayuda}</p>}</div>
                        <span className="roles-group-count">{activos}/{ids.length}</span>
                        <button type="button" className="roles-link-btn" onClick={() => toggleGrupo(ids, activos < ids.length)}>
                          {activos < ids.length ? 'Todos' : 'Ninguno'}
                        </button>
                      </header>
                      <ul>
                        {g.items.map((p) => (
                          <li key={p.id}>
                            <label className="roles-perm">
                              <span className="roles-perm-text">
                                <strong>{p.descripcion || p.nombre}</strong>
                                <code>{p.nombre}</code>
                              </span>
                              <input type="checkbox" role="switch" className="roles-switch" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                            </label>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            )}

            <footer className={`roles-savebar ${dirty ? 'dirty' : ''}`}>
              <span>{dirty ? 'Tienes cambios sin guardar' : 'Sin cambios pendientes'}</span>
              <button type="button" className="roles-link-btn" disabled={!dirty || saving} onClick={() => setSelected(new Set(original))}>Descartar</button>
              <button type="button" className="stage-btn-primary" disabled={!dirty || saving || selected.size === 0} onClick={guardar}>
                {saving ? 'Guardando…' : 'Guardar permisos'}
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
};
