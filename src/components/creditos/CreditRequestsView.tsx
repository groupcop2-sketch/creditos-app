import { useState, type ReactNode } from 'react';
import { ArrowDownWideNarrow, ArrowRight, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, FileText, LayoutGrid, Package, Plus, Search, SlidersHorizontal, UserRound, Wallet, XCircle } from 'lucide-react';
import type { CreditoRow } from '../../api';
import { SearchableDropdown, type DropdownOption } from './SearchableDropdown';
import { DateRangePicker } from './DateRangePicker';

type Props = {
  creditos: CreditoRow[];
  showForm: boolean;
  onToggleForm: () => void;
  onOpenCredit: (id: number) => void;
  children?: ReactNode;
};

const money = (value: number | null) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value ?? 0);
const date = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const creditStatusGroup = (value: string | null) => {
  const status = (value ?? '').toUpperCase();
  if (status.includes('RECHAZ')) return 'RECHAZADA';
  if (status.includes('APROB')) return 'APROBADA';
  if (!status || ['PROCESO', 'PENDIENTE', 'SOLICIT', 'RADIC', 'ESTUDIO', 'VALID'].some((key) => status.includes(key))) return 'PROCESO';
  return 'OTRO';
};

export function CreditRequestsView({ creditos, showForm, onToggleForm, onOpenCredit, children }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [product, setProduct] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [order, setOrder] = useState('recent');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const counts = {
    TODOS: creditos.length,
    PROCESO: creditos.filter((row) => creditStatusGroup(row.estado) === 'PROCESO').length,
    APROBADA: creditos.filter((row) => creditStatusGroup(row.estado) === 'APROBADA').length,
    RECHAZADA: creditos.filter((row) => creditStatusGroup(row.estado) === 'RECHAZADA').length
  };
  const filtered = creditos.filter((row) => {
    const query = search.trim().toLocaleLowerCase();
    const day = row.fechaRadicacion?.slice(0, 10) ?? '';
    return (!query || [row.nombreCliente, row.identificacionCliente, row.consecutivo, row.producto].some((value) => String(value ?? '').toLocaleLowerCase().includes(query)))
      && (status === 'TODOS' || creditStatusGroup(row.estado) === status)
      && (!product || String(row.idProductoCredito) === product)
      && (!from || day >= from) && (!to || day <= to);
  }).sort((a, b) => order === 'amount' ? b.montoSolicitado - a.montoSolicitado : order === 'client' ? a.nombreCliente.localeCompare(b.nombreCliente) : (Date.parse(b.fechaRadicacion) || 0) - (Date.parse(a.fechaRadicacion) || 0));
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const reset = () => { setSearch(''); setStatus('TODOS'); setProduct(''); setFrom(''); setTo(''); setPage(1); };
  const exportList = () => {
    const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""').replace(/^[=+@-]/, "'$&")}"`;
    const lines = [['Consecutivo', 'Cliente', 'Identificación', 'Producto', 'Monto solicitado', 'Plazo', 'Cuota estimada', 'Estado', 'Fecha solicitud'], ...filtered.map((row) => [row.consecutivo, row.nombreCliente, row.identificacionCliente, row.producto, row.montoSolicitado, row.plazo, row.cuotaEstimada, row.estado, row.fechaRadicacion])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.map((line) => line.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'solicitudes-credito.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const metrics = [
    { label: 'Total solicitudes', value: counts.TODOS, note: 'Operaciones registradas', icon: FileText, tone: 'blue' },
    { label: 'Monto solicitado', value: money(creditos.reduce((total, row) => total + Number(row.montoSolicitado || 0), 0)), note: 'Total de las solicitudes', icon: Wallet, tone: 'green' },
    { label: 'En proceso', value: counts.PROCESO, note: 'Pendientes de resolución', icon: Clock3, tone: 'blue' },
    { label: 'Aprobadas', value: counts.APROBADA, note: 'Solicitudes aprobadas', icon: CheckCircle2, tone: 'green' },
    { label: 'Rechazadas', value: counts.RECHAZADA, note: 'Solicitudes rechazadas', icon: XCircle, tone: 'red' }
  ];
  const statuses = [{ key: 'TODOS', label: 'Todos', icon: FileText }, { key: 'PROCESO', label: 'En proceso', icon: Clock3 }, { key: 'APROBADA', label: 'Aprobadas', icon: CheckCircle2 }, { key: 'RECHAZADA', label: 'Rechazadas', icon: XCircle }] as const;
  const statusOptions: DropdownOption[] = statuses.map(({ key, label, icon: Icon }) => ({ value: key, label, count: counts[key], icon: key === 'TODOS' ? <LayoutGrid size={16} /> : <Icon size={16} />, tone: key === 'APROBADA' ? 'green' : key === 'RECHAZADA' ? 'red' : 'blue' }));
  const productTones = ['purple', 'orange', 'cyan', 'blue'] as const;
  const orderOptions: DropdownOption[] = [
    { value: 'recent', label: 'Fecha de solicitud (más reciente)', icon: <CalendarDays size={16} />, tone: 'blue' },
    { value: 'amount', label: 'Monto solicitado (mayor primero)', icon: <ArrowDownWideNarrow size={16} />, tone: 'green' },
    { value: 'client', label: 'Nombre del cliente', icon: <UserRound size={16} />, tone: 'purple' }
  ];
  const productOptions: DropdownOption[] = [
    { value: '', label: 'Todos', count: creditos.length, icon: <Package size={16} />, tone: 'blue' },
    ...Array.from(new Map(creditos.map((row) => [row.idProductoCredito, row.producto])).entries()).map(([id, name], index) => ({ value: String(id), label: name, count: creditos.filter((row) => row.idProductoCredito === id).length, icon: <Package size={16} />, tone: productTones[index % productTones.length] }))
  ];
  return (
    <div className="credit-requests-view">
      <header className="requests-heading">
        <div><h1>Solicitudes de Crédito</h1><p>Gestiona, valida y realiza seguimiento integral a las solicitudes de crédito.</p></div>
        <div className="requests-actions"><button className="requests-button secondary" type="button" onClick={exportList}><Download size={16} />Exportar</button><button className="requests-button" type="button" onClick={onToggleForm}><Plus size={16} />{showForm ? 'Ocultar formulario' : 'Radicar nueva solicitud'}</button></div>
      </header>
      <div className="requests-metrics">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => <article className="requests-metric" key={label}><span className={`requests-metric-icon ${tone}`}><Icon size={22} /></span><div><span>{label}</span><strong title={String(value)}>{value}</strong><small>{note}</small></div></article>)}
      </div>
      <section className="requests-filters" aria-label="Filtros de solicitudes">
        <div className="requests-filter-grid">
          <label className="requests-search"><Search size={17} /><input aria-label="Buscar solicitudes" placeholder="Buscar por cliente, documento o consecutivo…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></label>
          <SearchableDropdown label="Estado" value={status} options={statusOptions} searchPlaceholder="Buscar estado…" onChange={(value) => { setStatus(value); setPage(1); }} />
          <SearchableDropdown label="Producto" value={product} options={productOptions} searchPlaceholder="Buscar producto…" onChange={(value) => { setProduct(value); setPage(1); }} />
          <DateRangePicker from={from} to={to} onChange={(start, end) => { setFrom(start); setTo(end); setPage(1); }} />
          <button className="requests-button secondary" type="button" onClick={reset}><SlidersHorizontal size={15} />Limpiar</button>
        </div>
        <div className="requests-status-tabs">{statuses.map(({ key, label, icon: Icon }) => <button key={key} className={status === key ? 'selected' : ''} type="button" aria-pressed={status === key} onClick={() => { setStatus(key); setPage(1); }}><Icon size={14} />{label}<span>{counts[key]}</span></button>)}</div>
      </section>
      {children}
      <section className="requests-list">
        <div className="requests-list-heading"><div><h2>Listado de solicitudes <span>({filtered.length})</span></h2><p>Visualiza y gestiona las solicitudes de crédito registradas en el sistema.</p></div><div className="requests-sort-control"><SearchableDropdown label="Ordenar por" value={order} options={orderOptions} searchPlaceholder="Buscar criterio…" onChange={(value) => { setOrder(value); setPage(1); }} /></div></div>
        <div className="requests-table-scroll"><table><thead><tr><th>#</th><th>Cliente</th><th>Producto</th><th>Monto solicitado</th><th>Plazo</th><th>Cuota estimada</th><th>Estado</th><th>Fecha solicitud</th><th>Acción</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><button className="requests-credit-number" type="button" onClick={() => onOpenCredit(row.id)}>#{row.consecutivo}</button></td><td><strong>{row.nombreCliente}</strong><small>{row.identificacionCliente}</small></td><td>{row.producto}</td><td className="requests-amount">{money(row.montoSolicitado)}</td><td>{row.plazo} meses</td><td className="requests-amount">{row.cuotaEstimada == null ? '—' : money(row.cuotaEstimada)}</td><td><span className={`requests-state ${creditStatusGroup(row.estado).toLowerCase()}`}><i />{row.estado || 'En proceso'}</span></td><td>{date(row.fechaRadicacion)}</td><td><button type="button" className="requests-button detail" onClick={() => onOpenCredit(row.id)}>Ver detalle<ArrowRight size={13} /></button></td></tr>)}
          {!rows.length && <tr><td colSpan={9} className="requests-empty"><FileText size={30} /><strong>{creditos.length ? 'No encontramos solicitudes con estos filtros' : 'Aún no hay solicitudes de crédito'}</strong><p>{creditos.length ? 'Prueba con otros criterios o limpia los filtros.' : 'Radica una nueva solicitud para comenzar.'}</p>{creditos.length > 0 && <button className="requests-button secondary" type="button" onClick={reset}>Limpiar filtros</button>}</td></tr>}
        </tbody></table></div>
        <footer className="requests-pagination"><span>Mostrando {filtered.length ? (currentPage - 1) * pageSize + 1 : 0} a {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} resultados</span><div><label>Filas por página <select aria-label="Filas por página" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option>10</option><option>20</option><option>50</option></select></label><button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span className="requests-page">{currentPage} / {pages}</span><button type="button" aria-label="Página siguiente" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></footer>
      </section>
    </div>
  );
}
