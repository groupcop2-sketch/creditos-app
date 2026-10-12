import { useId, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parse = (value: string) => { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day, 12); };
const todayKey = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-');
};
const display = (value: string) => value ? value.split('-').reverse().join('/') : 'Seleccionar fecha';
const shortDate = (value: string) => value ? parse(value).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha';

export function quickDateRange(label: string, today: Date): [string, string] {
  let start = new Date(today); let end = new Date(today);
  switch (label) {
    case 'Ayer': start.setDate(start.getDate() - 1); end = new Date(start); break;
    case 'Últimos 7 días': start.setDate(start.getDate() - 6); break;
    case 'Últimos 30 días': start.setDate(start.getDate() - 29); break;
    case 'Este mes': start.setDate(1); break;
    case 'Mes anterior': start = new Date(today.getFullYear(), today.getMonth() - 1, 1, 12); end = new Date(today.getFullYear(), today.getMonth(), 0, 12); break;
    case 'Este año': start = new Date(today.getFullYear(), 0, 1, 12); break;
    case 'Año anterior': start = new Date(today.getFullYear() - 1, 0, 1, 12); end = new Date(today.getFullYear() - 1, 11, 31, 12); break;
  }
  return [dateKey(start), dateKey(end)];
}

type Props = { from: string; to: string; onChange: (from: string, to: string) => void };

export function DateRangePicker({ from, to, onChange }: Props) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const firstTrigger = useRef<HTMLButtonElement>(null);
  const today = todayKey();
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [picking, setPicking] = useState<'from' | 'to'>('from');
  const [month, setMonth] = useState(() => { const date = parse(from || today); return new Date(date.getFullYear(), date.getMonth(), 1, 12); });
  const [quick, setQuick] = useState('');
  const show = (field: 'from' | 'to') => {
    if (!open) { setDraftFrom(from); setDraftTo(to); setQuick(''); const date = parse((field === 'from' ? from : to) || today); setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12)); }
    setPicking(field); setOpen(true);
  };
  const close = () => { setOpen(false); firstTrigger.current?.focus(); };
  const selectDay = (value: string) => {
    setQuick('');
    if (picking === 'from') { setDraftFrom(value); if (draftTo && draftTo < value) setDraftTo(''); setPicking('to'); }
    else if (draftFrom && value < draftFrom) { setDraftTo(draftFrom); setDraftFrom(value); }
    else { setDraftTo(value); if (!draftFrom) setDraftFrom(value); }
  };
  const quickLabels = ['Hoy', 'Ayer', 'Últimos 7 días', 'Últimos 30 días', 'Este mes', 'Mes anterior', 'Este año', 'Año anterior'];
  const calendar = (offset: number) => {
    const first = new Date(month.getFullYear(), month.getMonth() + offset, 1, 12);
    const title = first.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    const days = Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + index, 12));
    return <section className="date-range-calendar" aria-label={title} key={offset}>
      <div className="date-range-month"><button type="button" className="date-range-nav" aria-label="Mes anterior" style={{ visibility: offset === 0 ? 'visible' : 'hidden' }} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}><ChevronLeft size={16} /></button><strong>{title}</strong><button type="button" className="date-range-nav" aria-label="Mes siguiente" style={{ visibility: offset === 1 ? 'visible' : 'hidden' }} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}><ChevronRight size={16} /></button></div>
      <div className="date-range-days">{['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((day) => <span className="date-range-weekday" key={day}>{day}</span>)}{days.map((day) => {
        const key = dateKey(day); const endpoint = key === draftFrom || key === draftTo; const within = Boolean(draftFrom && draftTo && key > draftFrom && key < draftTo);
        return <button type="button" key={key} className={`date-range-day ${day.getMonth() !== first.getMonth() ? 'muted' : ''} ${endpoint ? 'endpoint' : ''} ${within ? 'within' : ''} ${key === today ? 'today' : ''}`} aria-label={day.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} aria-pressed={endpoint || within} aria-current={key === today ? 'date' : undefined} onClick={() => selectDay(key)}>{day.getDate()}</button>;
      })}</div>
    </section>;
  };
  return <div className="date-range-picker" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); } }}>
    <div className="date-range-fields">{(['from', 'to'] as const).map((field) => {
      const value = field === 'from' ? from : to; const label = field === 'from' ? 'Desde' : 'Hasta';
      return <div className={`date-range-field ${open && picking === field ? 'focused' : ''}`} key={field}><span>{label}</span><div><button ref={field === 'from' ? firstTrigger : undefined} type="button" className="date-range-trigger" aria-label={`${label}: ${display(value)}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => show(field)}><CalendarDays size={15} /><span>{display(value)}</span></button>{value && <button type="button" className="date-range-clear" aria-label={`Limpiar fecha ${label.toLowerCase()}`} onClick={() => { onChange(field === 'from' ? '' : from, field === 'to' ? '' : to); setOpen(false); }}><X size={13} /></button>}</div></div>;
    })}</div>
    {open && <div className="date-range-panel" role="dialog" aria-label="Seleccionar rango de fechas" id={`${id}-panel`}>
      <div className="date-range-body">{calendar(0)}{calendar(1)}<section className="date-range-presets"><strong>Rangos rápidos</strong>{quickLabels.map((label) => <button type="button" key={label} className={quick === label ? 'selected' : ''} onClick={() => { const [start, end] = quickDateRange(label, parse(today)); setDraftFrom(start); setDraftTo(end); const date = parse(start); setMonth(new Date(date.getFullYear(), date.getMonth(), 1, 12)); setQuick(label); }}>{label}</button>)}</section></div>
      <footer className="date-range-footer"><span>{shortDate(draftFrom)}<ArrowRight size={15} />{shortDate(draftTo)}</span><div><button type="button" className="requests-button secondary" onClick={() => { setDraftFrom(''); setDraftTo(''); setQuick(''); setPicking('from'); onChange('', ''); close(); }}>Limpiar</button><button type="button" className="requests-button" onClick={() => { onChange(draftFrom, draftTo); close(); }}>Aplicar</button></div></footer>
    </div>}
  </div>;
}
