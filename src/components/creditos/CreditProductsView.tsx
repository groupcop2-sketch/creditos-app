import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Layers, MoreHorizontal, Package, Pencil, Plus, Power, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import type { ProductoCreditoRow } from '../../api';
import { SearchableDropdown } from './SearchableDropdown';

type Props = {
  products: ProductoCreditoRow[]; busy: boolean; onCreate: () => void;
  onEdit: (product: ProductoCreditoRow) => void; onVersion: (product: ProductoCreditoRow) => void;
  onToggle: (product: ProductoCreditoRow) => void; onDelete: (product: ProductoCreditoRow) => void;
  onConfigure: (product: ProductoCreditoRow) => void;
};
const money = (value: number | null) => value == null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
export function CreditProductsView({ products, busy, onCreate, onEdit, onVersion, onToggle, onDelete, onConfigure }: Props) {
  const [query, setQuery] = useState(''); const [type, setType] = useState(''); const [status, setStatus] = useState(''); const [lender, setLender] = useState('');
  const [advanced, setAdvanced] = useState(false); const [rate, setRate] = useState(''); const [page, setPage] = useState(1); const [size, setSize] = useState(10);
  const [menuId, setMenuId] = useState<number | null>(null); const [detailId, setDetailId] = useState<number | null>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const filtered = products.filter((product) => {
    const term = query.toLocaleLowerCase().trim();
    return (!term || [product.nombre, product.consecutivo, product.descripcion, product.tipoCredito].some((text) => (text ?? '').toLocaleLowerCase().includes(term)))
      && (!type || String(product.idTipoCredito) === type) && (!status || (status === 'active') === product.activo)
      && (!lender || (lender === 'none' ? product.idLibranzera == null : String(product.idLibranzera) === lender)) && (!rate || product.tipoTasa === rate);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / size)); const current = Math.min(page, pages); const visible = filtered.slice((current - 1) * size, current * size);
  const details = products.find((product) => product.id === detailId);
  const reset = () => { setQuery(''); setType(''); setStatus(''); setLender(''); setRate(''); setPage(1); };
  const selectFilter = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); setMenuId(null); };
  const metrics = [
    { label: 'Total de productos', value: new Set(products.map((product) => product.idProductoBase ?? product.id)).size, icon: Package, tone: 'blue' },
    { label: 'Productos activos', value: products.filter((product) => product.activo).length, icon: CheckCircle2, tone: 'green' },
    { label: 'Versiones registradas', value: products.length, icon: Layers, tone: 'purple' },
    { label: 'Productos inactivos', value: products.filter((product) => !product.activo).length, icon: Power, tone: 'orange' }
  ];
  return <section className="credit-requests-view credit-products-view">
    <header className="requests-heading"><div><h1>Productos de crédito</h1><p>Administra los productos de crédito, sus versiones y configuraciones.</p></div><button type="button" className="requests-button" disabled={busy} onClick={onCreate}><Plus size={16} />Nuevo producto</button></header>
    <div className="requests-metrics product-metrics">{metrics.map(({ label, value, icon: Icon, tone }) => <article className="requests-metric" key={label}><span className={`requests-metric-icon ${tone}`}><Icon size={22} /></span><div><span>{label}</span><strong>{value}</strong></div></article>)}</div>
    <section className="requests-list products-list">
      <div className="products-filter-grid"><label className="requests-search"><Search size={16} /><input aria-label="Buscar productos" placeholder="Buscar por nombre, código o tipo de crédito…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setMenuId(null); }} /></label>
        <SearchableDropdown label="Tipo de crédito" value={type} onChange={selectFilter(setType)} options={[{ value: '', label: 'Todos' }, ...Array.from(new Map(products.map((product) => [product.idTipoCredito, product.tipoCredito])).entries()).map(([id, label]) => ({ value: String(id), label }))]} />
        <SearchableDropdown label="Estado" value={status} onChange={selectFilter(setStatus)} options={[{ value: '', label: 'Todos' }, { value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]} />
        <SearchableDropdown label="Libranzera" value={lender} onChange={selectFilter(setLender)} options={[{ value: '', label: 'Todas' }, { value: 'none', label: 'Sin libranzera' }, ...Array.from(new Map(products.filter((product) => product.idLibranzera != null).map((product) => [product.idLibranzera, product.libranzera])).entries()).map(([id, label]) => ({ value: String(id), label: label || 'Sin nombre' }))]} />
        <button type="button" className="requests-button secondary" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}><SlidersHorizontal size={14} />Filtros avanzados</button><button type="button" className="requests-button secondary" onClick={reset}>Limpiar</button>
      </div>
      {advanced && <div className="products-advanced-filter"><SearchableDropdown label="Tipo de tasa" value={rate} onChange={selectFilter(setRate)} options={[{ value: '', label: 'Todas' }, ...Array.from(new Set(products.map((product) => product.tipoTasa))).map((value) => ({ value, label: value }))]} /></div>}
      <div className="requests-table-scroll products-table-scroll"><table><thead><tr><th>#</th><th>Producto</th><th>Código</th><th>Tipo de crédito</th><th>Versión</th><th>Estado</th><th>Monto máximo</th><th>Plazo</th><th>Tasa</th><th>Libranzera</th><th>Acciones</th></tr></thead><tbody>{visible.map((product, index) => <tr key={product.id}>
        <td>{(current - 1) * size + index + 1}</td><td><div className="product-name-cell"><span className="product-table-icon"><Package size={18} /></span><div><strong>{product.nombre}</strong><small>{product.descripcion || 'Sin descripción'}</small></div></div></td><td>{product.consecutivo || '—'}</td><td>{product.tipoCredito}</td><td><span className="product-version-badge">v{product.version ?? 1}</span></td><td><span className={`requests-state ${product.activo ? 'aprobada' : 'rechazada'}`}><i />{product.activo ? 'Activo' : 'Inactivo'}</span></td><td className="requests-amount">{money(product.montoMaximo)}</td><td>{product.plazoMinimo ?? '—'} – {product.plazoMaximo ?? '—'} {product.modeloPlazo?.toLocaleLowerCase()}</td><td>{product.tipoTasa}</td><td>{product.libranzera || 'Sin libranzera'}</td>
        <td><div className="product-row-menu" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !menu.current?.contains(event.relatedTarget as Node | null)) setMenuId(null); }} onKeyDown={(event) => { if (event.key === 'Escape') { setMenuId(null); event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus(); } }}><button type="button" className="product-menu-trigger" aria-label={`Acciones de ${product.nombre}`} aria-expanded={menuId === product.id} disabled={busy} onClick={(event) => { const rect = event.currentTarget.getBoundingClientRect(); setMenuPosition({ top: Math.max(10, Math.min(rect.bottom + 5, window.innerHeight - 200)), left: Math.max(10, Math.min(rect.right - 170, window.innerWidth - 180)) }); setMenuId(menuId === product.id ? null : product.id); }}><MoreHorizontal size={16} /></button>{menuId === product.id && createPortal(<div ref={menu} className="product-actions-popover" style={menuPosition}>{[
          { label: 'Editar', icon: Pencil, action: () => onEdit(product) }, { label: 'Nueva versión', icon: Layers, action: () => onVersion(product) },
          { label: product.activo ? 'Inactivar' : 'Activar', icon: Power, action: () => onToggle(product) }, { label: 'Eliminar', icon: Trash2, action: () => onDelete(product), danger: true },
          { label: 'Ver detalles', icon: Eye, action: () => setDetailId(product.id) }
        ].map(({ label, icon: Icon, action, danger }) => <button type="button" key={label} className={danger ? 'danger' : ''} onClick={() => { setMenuId(null); action(); }}><Icon size={13} />{label}</button>)}</div>, document.body)}</div></td>
      </tr>)}{!visible.length && <tr><td colSpan={11} className="requests-empty"><Package size={30} /><strong>{products.length ? 'No encontramos productos con estos filtros' : 'Aún no hay productos de crédito'}</strong><p>{products.length ? 'Limpia los filtros para ver todos los productos.' : 'Crea tu primer producto para comenzar.'}</p></td></tr>}</tbody></table></div>
      <footer className="requests-pagination"><span>Mostrando {filtered.length ? (current - 1) * size + 1 : 0} a {Math.min(current * size, filtered.length)} de {filtered.length} resultados</span><div><button type="button" aria-label="Página anterior" disabled={current === 1} onClick={() => { setPage(current - 1); setMenuId(null); }}><ChevronLeft size={15} /></button><span className="requests-page">{current} / {pages}</span><button type="button" aria-label="Página siguiente" disabled={current === pages} onClick={() => { setPage(current + 1); setMenuId(null); }}><ChevronRight size={15} /></button><select aria-label="Productos por página" value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); setMenuId(null); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></div></footer>
    </section>
    {details && <section className="product-detail-summary"><header><div><h2>{details.nombre} <span>v{details.version}</span></h2><p>{details.descripcion || 'Configuración del producto de crédito'}</p></div><button type="button" className="requests-button secondary" aria-label="Cerrar detalles del producto" onClick={() => setDetailId(null)}><X size={16} /></button></header><dl>{[['Monto', `${money(details.montoMinimo)} – ${money(details.montoMaximo)}`], ['Plazo', `${details.plazoMinimo ?? '—'} – ${details.plazoMaximo ?? '—'} ${details.modeloPlazo.toLocaleLowerCase()}`], ['Tasa', details.tipoTasa], ['Reglas', `${details.atributos} atributos · ${details.documentos} documentos · ${details.etapas} etapas`], ['Calendario', `${details.periodicidad || '—'} · Corte ${details.diaCorte ?? '—'}`], ['Codeudores', details.requiereCodeudor ? String(details.numeroCodeudores) : 'No requeridos']].map(([label, content]) => <div key={label}><dt>{label}</dt><dd>{content}</dd></div>)}</dl><button type="button" className="requests-button" disabled={busy} onClick={() => onConfigure(details)}>Configurar condiciones y cargos<ChevronRight size={14} /></button></section>}
  </section>;
}
