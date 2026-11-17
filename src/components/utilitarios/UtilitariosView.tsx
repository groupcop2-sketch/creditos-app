import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Database, Lock, Pencil, Plus, Search, X } from 'lucide-react';
import { request } from '../../api';

type Campo = { col: string; label: string; max: number; requerido?: boolean; mayus?: boolean; ancho?: 'corto' };
type CatalogoResumen = { key: string; titulo: string; descripcion: string; grupo: string; sistema: boolean; total: number; activos: number };
type Fila = { id: number; valores: Record<string, string>; padreId: number | null; activo: boolean; enUso: number | null };
type Detalle = {
  catalogo: { key: string; titulo: string; descripcion: string; grupo: string; sistema: boolean; editable: boolean; desactivable: boolean; usoConocido: boolean; padre: { col: string; catalogo: string; label: string } | null; campos: Campo[] };
  total: number;
  filas: Fila[];
};
type Props = { token: string; notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void; puedeEditar: boolean };

const U = '/api/v1/utilitarios/catalogos';
const api = {
  catalogos: (t: string) => request<CatalogoResumen[]>(U, {}, t),
  opciones: (t: string, key: string, q: string, padre: number | null, limite = 300) =>
    request<Detalle>(`${U}/${key}?limite=${limite}${q ? `&q=${encodeURIComponent(q)}` : ''}${padre ? `&padre=${padre}` : ''}`, {}, t),
  crear: (t: string, key: string, valores: Record<string, string>, padreId: number | null) =>
    request<{ id: number }>(`${U}/${key}`, { method: 'POST', body: JSON.stringify({ valores, padreId }) }, t),
  editar: (t: string, key: string, id: number, valores: Record<string, string>, padreId: number | null) =>
    request<{ id: number }>(`${U}/${key}/${id}`, { method: 'PUT', body: JSON.stringify({ valores, padreId }) }, t),
  activo: (t: string, key: string, id: number, activo: boolean) =>
    request<{ id: number; activo: boolean }>(`${U}/${key}/${id}/activo`, { method: 'PATCH', body: JSON.stringify({ activo }) }, t)
};
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const msg = (e: unknown, f: string) => (e instanceof Error && e.message ? e.message : f);

/** Lookup tables behind the app's combos: add, rename and deactivate options without touching the database. */
export const UtilitariosView: React.FC<Props> = ({ token, notify, puedeEditar }) => {
  const [catalogos, setCatalogos] = useState<CatalogoResumen[]>([]);
  const [key, setKey] = useState<string | null>(null);
  const [filtroLista, setFiltroLista] = useState('');
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [q, setQ] = useState('');
  const [padre, setPadre] = useState<number | null>(null);
  const [padres, setPadres] = useState<Array<{ id: number; nombre: string }>>([]);
  const [verInactivas, setVerInactivas] = useState(true);
  const [editando, setEditando] = useState<number | 'nueva' | null>(null);
  const [borrador, setBorrador] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const primerInput = useRef<HTMLInputElement>(null);

  const cargarCatalogos = useCallback(() => api.catalogos(token).then((c) => { setCatalogos(c); setKey((k) => k ?? c[0]?.key ?? null); })
    .catch((e) => notify(msg(e, 'No se pudieron cargar las tablas'), 'error')), [token]);
  useEffect(() => { void cargarCatalogos(); }, [cargarCatalogos]);

  const cargar = useCallback(async () => {
    if (!key) return;
    setCargando(true);
    try { setDetalle(await api.opciones(token, key, q.trim(), padre)); }
    catch (e) { notify(msg(e, 'No se pudo cargar la tabla'), 'error'); }
    finally { setCargando(false); }
  }, [token, key, q, padre]);
  // Search is server-side (ciudades has 1.100+ rows): debounce typing.
  useEffect(() => { const t = setTimeout(() => void cargar(), q ? 250 : 0); return () => clearTimeout(t); }, [cargar]);

  useEffect(() => { setQ(''); setPadre(null); setEditando(null); }, [key]);
  useEffect(() => {
    const p = detalle?.catalogo.padre;
    if (!p) { setPadres([]); return; }
    api.opciones(token, p.catalogo, '', null, 1000)
      .then((d) => setPadres(d.filas.map((f) => ({ id: f.id, nombre: f.valores[d.catalogo.campos[0].col] }))))
      .catch(() => setPadres([]));
  }, [detalle?.catalogo.padre?.catalogo, token]);
  useEffect(() => { if (editando !== null) primerInput.current?.focus(); }, [editando]);

  const grupos = useMemo(() => {
    const f = norm(filtroLista.trim());
    const visibles = catalogos.filter((c) => !f || norm(`${c.titulo} ${c.descripcion}`).includes(f));
    const out = new Map<string, CatalogoResumen[]>();
    visibles.forEach((c) => out.set(c.grupo, [...(out.get(c.grupo) ?? []), c]));
    return [...out.entries()];
  }, [catalogos, filtroLista]);

  const cat = detalle?.catalogo;
  const editable = Boolean(cat?.editable && puedeEditar);
  const filas = (detalle?.filas ?? []).filter((f) => verInactivas || f.activo);
  const inactivas = (detalle?.filas ?? []).filter((f) => !f.activo).length;
  const nombrePadre = (id: number | null) => padres.find((p) => p.id === id)?.nombre ?? '—';

  const empezar = (fila: Fila | null) => {
    if (!cat) return;
    setEditando(fila ? fila.id : 'nueva');
    setBorrador({ ...Object.fromEntries(cat.campos.map((c) => [c.col, fila?.valores[c.col] ?? ''])), __padre: String(fila?.padreId ?? padre ?? '') });
  };
  const guardar = async () => {
    if (!cat || editando === null) return;
    const { __padre, ...valores } = borrador;
    const padreId = __padre ? Number(__padre) : null;
    setGuardando(true);
    try {
      if (editando === 'nueva') await api.crear(token, cat.key, valores, padreId);
      else await api.editar(token, cat.key, editando, valores, padreId);
      notify(editando === 'nueva' ? `Opción agregada a ${cat.titulo.toLowerCase()}` : 'Cambios guardados', 'success');
      setEditando(null);
      await Promise.all([cargar(), cargarCatalogos()]);
    } catch (e) { notify(msg(e, 'No se pudo guardar'), 'error'); }
    finally { setGuardando(false); }
  };
  const alternar = async (fila: Fila) => {
    if (!cat) return;
    try {
      await api.activo(token, cat.key, fila.id, !fila.activo);
      const nombre = fila.valores[cat.campos.find((c) => c.requerido)?.col ?? cat.campos[0].col];
      notify(fila.activo ? `«${nombre}» ya no aparece en los combos` : `«${nombre}» vuelve a aparecer en los combos`, 'success');
      await Promise.all([cargar(), cargarCatalogos()]);
    } catch (e) { notify(msg(e, 'No se pudo cambiar el estado'), 'error'); }
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); void guardar(); }
    if (e.key === 'Escape') setEditando(null);
  };

  const filaEdicion = (id: number | 'nueva') => cat && (
    <tr key={`edit-${id}`} className="util-edit-row">
      {cat.campos.map((c, i) => (
        <td key={c.col}>
          <input ref={i === 0 ? primerInput : undefined} aria-label={c.label} maxLength={c.max} value={borrador[c.col] ?? ''} placeholder={c.label}
            className={c.mayus ? 'util-upper' : undefined} onKeyDown={onKey}
            onChange={(e) => setBorrador({ ...borrador, [c.col]: e.target.value })} />
        </td>
      ))}
      {cat.padre && (
        <td>
          <select aria-label={cat.padre.label} value={borrador.__padre ?? ''} onChange={(e) => setBorrador({ ...borrador, __padre: e.target.value })}>
            <option value="">{cat.padre.label}…</option>
            {padres.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </td>
      )}
      <td colSpan={cat.desactivable ? 3 : 2}>
        <div className="util-row-actions">
          <button type="button" className="rec-btn primary" disabled={guardando} onClick={guardar}><Check size={14} aria-hidden="true" /> {editando === 'nueva' ? 'Agregar' : 'Guardar'}</button>
          <button type="button" className="rec-btn link" onClick={() => setEditando(null)}>Cancelar</button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="roles-layout util">
      <aside className="roles-aside" aria-label="Tablas">
        <header><div><h2>Utilitarios</h2><small>{catalogos.length} tablas de opciones</small></div></header>
        <label className="roles-search util-aside-search"><Search size={14} aria-hidden="true" />
          <input type="search" placeholder="Buscar tabla…" aria-label="Buscar tabla" value={filtroLista} onChange={(e) => setFiltroLista(e.target.value)} /></label>
        <nav className="util-groups">
          {grupos.map(([grupo, items]) => (
            <div key={grupo} className="util-group">
              <span className="util-group-title">{grupo}</span>
              <ul className="roles-list">
                {items.map((c) => (
                  <li key={c.key}>
                    <button type="button" className={c.key === key ? 'active' : ''} aria-current={c.key === key} onClick={() => setKey(c.key)}>
                      <span className="roles-info"><strong>{c.titulo}</strong><small>{c.sistema ? 'Solo lectura' : c.activos === c.total ? `${c.total} opciones` : `${c.activos} activas de ${c.total}`}</small></span>
                      {c.sistema && <Lock size={13} aria-hidden="true" className="util-lock" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <section className="roles-editor" aria-label={cat?.titulo ?? 'Tabla'}>
        {!cat ? <div className="roles-empty"><Database size={32} aria-hidden="true" /><p>Cargando tablas…</p></div> : (
          <>
            <header className="roles-editor-head">
              <div>
                <span className="section-kicker">{cat.grupo}</span>
                <h2>{cat.titulo}</h2>
                <p className="util-desc">{cat.descripcion}</p>
                <div className="roles-chips">
                  <span>{detalle!.total} opciones</span>
                  {inactivas > 0 && <span>{inactivas} inactivas</span>}
                  {cat.sistema && <span><Lock size={11} aria-hidden="true" /> Tabla del sistema: el código depende de estos valores</span>}
                  {!cat.sistema && !puedeEditar && <span>Solo lectura para tu rol</span>}
                </div>
              </div>
              {editable && <button type="button" className="roles-new-btn" disabled={editando === 'nueva'} onClick={() => empezar(null)}><Plus size={14} aria-hidden="true" /> Agregar opción</button>}
            </header>

            <div className="util-toolbar">
              <label className="roles-search"><Search size={15} aria-hidden="true" />
                <input type="search" placeholder={`Buscar en ${cat.titulo.toLowerCase()}…`} aria-label="Buscar opción" value={q} onChange={(e) => setQ(e.target.value)} /></label>
              {cat.padre && (
                <select aria-label={`Filtrar por ${cat.padre.label}`} value={padre ?? ''} onChange={(e) => setPadre(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Todos los {cat.padre.label.toLowerCase()}s</option>
                  {padres.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              )}
              {cat.desactivable && inactivas > 0 && (
                <label className="util-check"><input type="checkbox" checked={verInactivas} onChange={(e) => setVerInactivas(e.target.checked)} /> Mostrar inactivas</label>
              )}
            </div>

            <div className="rec-tscroll">
              <table className="rec-table util-table">
                <thead>
                  <tr>
                    {cat.campos.map((c) => <th key={c.col} className={c.ancho === 'corto' ? 'util-short' : undefined}>{c.label}</th>)}
                    {cat.padre && <th>{cat.padre.label}</th>}
                    <th className="num" title="Registros de otras tablas que usan esta opción">En uso</th>
                    {cat.desactivable && <th>En combos</th>}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {editando === 'nueva' && filaEdicion('nueva')}
                  {!filas.length && editando !== 'nueva' && (
                    <tr><td colSpan={cat.campos.length + 3 + (cat.padre ? 1 : 0)} className="muted-note">{cargando ? 'Cargando…' : q ? `Nada coincide con «${q}».` : 'Esta tabla no tiene opciones todavía.'}</td></tr>
                  )}
                  {filas.map((f) => editando === f.id ? filaEdicion(f.id) : (
                    <tr key={f.id} className={f.activo ? undefined : 'util-inactive'}>
                      {cat.campos.map((c, i) => (
                        <td key={c.col} className={c.mayus || c.ancho === 'corto' ? 'rec-mono' : undefined}>
                          {i === 0 || c.requerido ? <strong>{f.valores[c.col] || '—'}</strong> : f.valores[c.col] || '—'}
                          {i === 0 && !f.activo && <span className="rec-pill rec-neutral util-pill">Inactiva</span>}
                        </td>
                      ))}
                      {cat.padre && <td>{nombrePadre(f.padreId)}</td>}
                      <td className="num">{f.enUso == null ? <span className="rec-muted" title="Esta tabla no tiene relaciones registradas en la base">—</span> : f.enUso}</td>
                      {cat.desactivable && (
                        <td>
                          <input type="checkbox" role="switch" className="roles-switch" checked={f.activo} disabled={!editable}
                            aria-label={`${f.activo ? 'Ocultar' : 'Mostrar'} en los combos`} onChange={() => alternar(f)} />
                        </td>
                      )}
                      <td>{editable && <button type="button" className="rec-btn link" aria-label="Editar" onClick={() => empezar(f)}><Pencil size={14} aria-hidden="true" /> Editar</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="util-foot">
              {detalle!.filas.length < detalle!.total
                ? <span>Mostrando {detalle!.filas.length} de {detalle!.total}. Usa el buscar{cat.padre ? ` o filtra por ${cat.padre.label.toLowerCase()}` : ''} para encontrar el resto.</span>
                : <span>Las opciones inactivas no aparecen en los combos; los registros que ya las usan las conservan.</span>}
              {editando !== null && <span className="util-kbd"><X size={12} aria-hidden="true" /> Esc cancela · Enter guarda</span>}
            </footer>
          </>
        )}
      </section>
    </div>
  );
};
