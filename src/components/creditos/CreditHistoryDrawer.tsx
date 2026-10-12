import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, Clock3, FileText, History, Pencil, UserRound, X } from 'lucide-react';
import type { CreditoHistorialRow, CreditoRow } from '../../api';

const timezone = 'America/Bogota';
export function groupCreditHistory(records: CreditoHistorialRow[]) {
  const groups = new Map<string, { date: string; records: CreditoHistorialRow[] }>();
  [...records].sort((a, b) => (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0) || b.id - a.id).forEach((record) => {
    const date = new Date(record.fecha);
    const valid = !Number.isNaN(date.getTime());
    const key = valid ? new Intl.DateTimeFormat('sv-SE', { timeZone: timezone }).format(date) : 'unknown';
    const label = valid ? date.toLocaleDateString('es-CO', { timeZone: timezone, day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha no disponible';
    if (!groups.has(key)) groups.set(key, { date: label, records: [] });
    groups.get(key)!.records.push(record);
  });
  return Array.from(groups.values());
}
const actionStyle = (action: string) => {
  const name = action.toLocaleLowerCase();
  if (/aprob|carg|firm|complet/.test(name)) return { icon: Check, tone: 'green' };
  if (/edit|actualiz|modific/.test(name)) return { icon: Pencil, tone: 'purple' };
  if (/valid|estudio|proceso/.test(name)) return { icon: Clock3, tone: 'orange' };
  if (/asign/.test(name)) return { icon: UserRound, tone: 'blue' };
  return { icon: FileText, tone: 'blue' };
};
export function CreditHistoryDrawer({ credito, records, onClose }: { credito: CreditoRow; records: CreditoHistorialRow[]; onClose: () => void }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; closeButton.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
      if (event.key === 'Tab') {
        const buttons = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
        const first = buttons[0]; const last = buttons.at(-1);
        if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);
  const groups = groupCreditHistory(records);
  return createPortal(<div className="request-drawer-overlay" onClick={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <div className="request-drawer credit-history-drawer" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={panel}>
      <header className="request-drawer-heading"><span className="send-drawer-heading-icon"><History size={26} /></span><div><h2 id={`${id}-title`}>Historial de operaciones</h2><p>Crédito #{credito.consecutivo}<br />Consulta el registro cronológico de las acciones realizadas.</p></div><button ref={closeButton} className="request-drawer-close" type="button" aria-label="Cerrar historial" onClick={onClose}><X size={18} /></button></header>
      <div className="credit-history-content">
        <section className="credit-history-client"><span className="credit-applicant-avatar"><UserRound size={22} /></span><div><strong>{credito.nombreCliente}</strong><small>{credito.identificacionCliente}</small><b>CLIENTE</b></div><div className="credit-history-product"><small>{credito.producto}</small><strong>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(credito.montoSolicitado)}</strong><small>{credito.plazo} meses</small></div></section>
        {groups.map((group) => <section className="credit-history-date-group" key={group.date}><h3>{group.date}</h3><ol>{group.records.map((record) => {
          const { icon: Icon, tone } = actionStyle(record.accion);
          const date = new Date(record.fecha);
          const time = Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('es-CO', { timeZone: timezone, hour: 'numeric', minute: '2-digit' });
          return <li key={record.id}><time dateTime={record.fecha}>{time}</time><span className={`history-event-icon ${tone}`}><Icon size={17} /></span><article className="history-event-card"><h4>{record.accion.replace(/_/g, ' ')}</h4><p>{record.observacion || 'Sin observación registrada.'}</p>{(record.estadoAnterior || record.estadoNuevo) && <div className="history-event-transition"><span>{record.estadoAnterior?.replace(/_/g, ' ') || 'Sin estado previo'}</span><ArrowRight size={13} /><strong>{record.estadoNuevo?.replace(/_/g, ' ') || 'Sin estado registrado'}</strong></div>}<small>Usuario: {record.usuario || 'Sistema'}</small></article></li>;
        })}</ol></section>)}
        {!groups.length && <div className="credit-history-empty"><History size={32} /><strong>No hay operaciones registradas todavía</strong><p>Las acciones realizadas aparecerán aquí.</p></div>}
      </div>
      <footer className="request-drawer-footer"><span>{records.length} {records.length === 1 ? 'operación registrada' : 'operaciones registradas'}</span><button type="button" className="requests-button secondary" onClick={onClose}>Cerrar</button></footer>
    </div>
  </div>, document.body);
}
