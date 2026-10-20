import { useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Package, Pencil, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import type { FormulaCalculoRow, ProductoAtributoRow, ProductoCreditoRow } from '../../api';
import { SearchableDropdown } from './SearchableDropdown';

type Props = {
  products: ProductoCreditoRow[]; product: ProductoCreditoRow | undefined; attributes: ProductoAtributoRow[];
  descriptions: Record<string, string>; busy: boolean; children: ReactNode;
  tiposCalculo?: FormulaCalculoRow[];
  onSelectProduct: (id: number | null) => void; onEdit: (attribute: ProductoAtributoRow) => void; onDelete: (attribute: ProductoAtributoRow) => void;
};
const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export function labelOperacionCalculo(attribute: ProductoAtributoRow, tiposCalculo: FormulaCalculoRow[] = []): 'Porcentaje' | 'Valor fijo' | 'Manual' | 'Formula' {
  const formula = tiposCalculo.find(
    (tc) =>
      (attribute.idTipoCalculo != null && tc.id === attribute.idTipoCalculo) ||
      tc.nombre.trim().toUpperCase() === (attribute.tipoCalculo || '').trim().toUpperCase() ||
      (tc.codigo && tc.codigo.trim().toUpperCase() === (attribute.tipoCalculo || '').trim().toUpperCase())
  );
  const op = (formula?.operacion || '').toUpperCase();
  const name = (attribute.tipoCalculo || '').toUpperCase();
  const hasValor2 = attribute.valor2 != null && Number(attribute.valor2) > 0;
  const hasPorcentaje = attribute.porcentaje != null && Number(attribute.porcentaje) > 0;
  const hasValor = attribute.valor != null && Number(attribute.valor) > 0;

  if (op === 'MANUAL' || name.includes('MANUAL')) return 'Manual';
  if (
    Boolean(formula?.expresion) ||
    op === 'PERSONALIZADA' ||
    op.includes('BASE_') ||
    op.includes('VALOR2') ||
    op.includes('POR_PLAZO') ||
    hasValor2 ||
    name.includes('/') ||
    name.includes('VALOR2') ||
    (name.includes('PLAZO') && !name.includes('PORCENTAJE') && !hasPorcentaje)
  ) {
    return 'Formula';
  }
  if (op === 'PORCENTAJE' || op === 'PORCENTAJE_POR_PLAZO' || hasPorcentaje || name.includes('PORCENTAJE') || name.includes('%')) {
    return 'Porcentaje';
  }
  if (op === 'VALOR_FIJO' || hasValor || name.includes('VALOR FIJO') || name.includes('FIJO')) return 'Valor fijo';
  return hasPorcentaje ? 'Porcentaje' : 'Valor fijo';
}

export function ProductConditionsView({ products, product, attributes, descriptions, busy, children, tiposCalculo = [], onSelectProduct, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState(''); const [order, setOrder] = useState('name'); const [filters, setFilters] = useState(false);
  const [type, setType] = useState(''); const [iva, setIva] = useState(''); const [page, setPage] = useState(1); const [size, setSize] = useState(10);
  const filtered = attributes.filter((attribute) => {
    const calculoLabel = labelOperacionCalculo(attribute, tiposCalculo);
    return (!search.trim() || [attribute.nombre, descriptions[attribute.nombre], attribute.tipoAtributo, attribute.tipoCalculo, calculoLabel].some((value) => (value ?? '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))) && (!type || attribute.tipoAtributo === type) && (!iva || (iva === 'yes') === attribute.aplicaIva);
  }).sort((a, b) => order === 'value' ? (b.valor ?? 0) - (a.valor ?? 0) : order === 'priority' ? a.prioridad - b.prioridad : a.nombre.localeCompare(b.nombre));
  const pages = Math.max(1, Math.ceil(filtered.length / size)); const current = Math.min(page, pages); const visible = filtered.slice((current - 1) * size, current * size);
  return <section className="credit-requests-view product-conditions-view">
    <section className="conditions-product-context"><span className="conditions-product-icon"><Package size={28} /></span><div className="conditions-product-info"><small>PRODUCTO EN CONFIGURACIÓN</small><h2>{product?.nombre || 'Selecciona un producto'}</h2>{product && <p>Código: {product.consecutivo || '—'}<span>|</span>Tipo: {product.tipoCredito}<span>|</span>Estado: <b className={`requests-state ${product.activo ? 'aprobada' : 'rechazada'}`}><i />{product.activo ? 'Activo' : 'Inactivo'}</b></p>}</div><div className="conditions-product-selector"><SearchableDropdown label="Producto" value={product ? String(product.id) : ''} options={[{ value: '', label: 'Seleccionar producto' }, ...products.map((item) => ({ value: String(item.id), label: `${item.consecutivo || 'Sin código'} - ${item.nombre} · v${item.version}` }))]} onChange={(value) => onSelectProduct(Number(value) || null)} /></div>{product && <div className="conditions-context-counts"><span>{attributes.length} cargos</span><span>{product.documentos} documentos</span><span>{product.etapas} etapas</span></div>}</section>
    <section className="requests-list conditions-main-card"><header className="conditions-heading"><h1>Atributos asignados{product ? ` a ${product.nombre}` : ''}</h1><p>Selecciona un atributo del catálogo y asígnalo al producto. Puedes configurar su cálculo, valor, porcentaje e IVA.</p></header>
      {children}
      <div className="conditions-table-card"><div className="conditions-table-toolbar"><label className="requests-search"><Search size={16} /><input aria-label="Buscar atributo asignado" placeholder="Buscar atributo asignado…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label><button type="button" className="requests-button secondary" aria-expanded={filters} onClick={() => setFilters(!filters)}><SlidersHorizontal size={15} />Filtros</button><SearchableDropdown label="Ordenar por" value={order} options={[{ value: 'name', label: 'Nombre (A – Z)' }, { value: 'value', label: 'Valor (mayor primero)' }, { value: 'priority', label: 'Prioridad' }]} onChange={(value) => { setOrder(value); setPage(1); }} /></div>
        {filters && <div className="conditions-extra-filters"><SearchableDropdown label="Tipo" value={type} options={[{ value: '', label: 'Todos' }, ...Array.from(new Set(attributes.map((item) => item.tipoAtributo))).map((value) => ({ value, label: value }))]} onChange={(value) => { setType(value); setPage(1); }} /><SearchableDropdown label="IVA" value={iva} options={[{ value: '', label: 'Todos' }, { value: 'yes', label: 'Aplica IVA' }, { value: 'no', label: 'Sin IVA' }]} onChange={(value) => { setIva(value); setPage(1); }} /><button type="button" className="requests-button secondary" onClick={() => { setSearch(''); setType(''); setIva(''); setPage(1); }}>Limpiar filtros</button></div>}
        <div className="requests-table-scroll"><table><thead><tr><th>#</th><th>Nombre</th><th>Tipo</th><th>Cálculo</th><th>Valor</th><th>%</th><th>IVA</th><th>Requerido</th><th>Acciones</th></tr></thead><tbody>{visible.map((item, index) => <tr key={item.id}><td>{(current - 1) * size + index + 1}</td><td><strong>{item.nombre}</strong>{descriptions[item.nombre] && <small>{descriptions[item.nombre]}</small>}</td><td>{item.tipoAtributo}</td><td>{labelOperacionCalculo(item, tiposCalculo)}</td><td className="requests-amount">{item.valor != null ? money(item.valor) : '—'}</td><td>{item.porcentaje != null ? `${item.porcentaje}%` : '—'}</td><td>{item.aplicaIva ? 'Sí' : 'No'}</td><td><span className={`requests-state ${item.obligatorio ? 'aprobada' : ''}`}><i />{item.obligatorio ? 'Obligatorio' : 'Opcional'}</span></td><td><div className="conditions-row-actions"><button type="button" disabled={busy || !product} className="conditions-edit" aria-label={`Editar ${item.nombre}`} onClick={() => onEdit(item)}><Pencil size={15} /></button><button type="button" disabled={busy || !product} className="conditions-delete" aria-label={`Eliminar ${item.nombre}`} onClick={() => onDelete(item)}><Trash2 size={15} /></button></div></td></tr>)}{!visible.length && <tr><td colSpan={9} className="requests-empty"><Package size={28} /><strong>{!product ? 'Selecciona un producto para configurar sus cargos' : attributes.length ? 'No encontramos atributos con estos filtros' : 'Este producto aún no tiene atributos asignados'}</strong><p>{product ? 'Selecciona un concepto del catálogo o ajusta los filtros.' : 'Utiliza el selector de producto en la parte superior.'}</p></td></tr>}</tbody></table></div>
        <footer className="requests-pagination"><span>Mostrando {filtered.length ? (current - 1) * size + 1 : 0} a {Math.min(current * size, filtered.length)} de {filtered.length} resultados</span><div><button type="button" aria-label="Página anterior" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={15} /></button><span className="requests-page">{current} / {pages}</span><button type="button" aria-label="Página siguiente" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={15} /></button><select aria-label="Atributos por página" value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></div></footer>
      </div>
    </section>
  </section>;
}
