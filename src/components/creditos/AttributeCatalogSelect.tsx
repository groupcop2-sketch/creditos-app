import { useId, useRef, useState } from 'react';
import { ChevronDown, Coins, FileText, Grid3X3, Layers, Percent, Search, ShieldCheck } from 'lucide-react';

export type AttributeCatalogOption = { id: number; nombre: string; descripcion: string; aplicaA: string; tipoFormula: string; activo: boolean };
const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
export const attributeCategory = (item: AttributeCatalogOption) => {
  const type = normalized(item.aplicaA); const name = normalized(item.nombre);
  if (type.includes('cuota')) return 'cuota';
  if (type.includes('segur') || name.includes('seguro')) return 'seguros';
  if (type.includes('comision') || name.includes('comision') || name.includes('corretaje')) return 'comisiones';
  if (type.includes('credito')) return 'credito';
  return 'otros';
};
const categories = [{ key: 'todos', label: 'Todos', icon: Layers }, { key: 'credito', label: 'Crédito', icon: FileText }, { key: 'cuota', label: 'Cuota', icon: Percent }, { key: 'comisiones', label: 'Comisiones', icon: Coins }, { key: 'seguros', label: 'Seguros', icon: ShieldCheck }, { key: 'otros', label: 'Otros', icon: Grid3X3 }];
export function AttributeCatalogSelect({ options, value, disabled, onChange }: { options: AttributeCatalogOption[]; value: string; disabled: boolean; onChange: (value: string) => void }) {
  const id = useId(); const input = useRef<HTMLInputElement>(null); const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false); const [query, setQuery] = useState(''); const [category, setCategory] = useState('todos'); const [active, setActive] = useState(0);
  const available = options.filter((option) => option.activo);
  const selected = available.find((option) => String(option.id) === value);
  const searched = available.filter((option) => [option.nombre, option.descripcion, option.aplicaA, option.tipoFormula].some((text) => normalized(text ?? '').includes(normalized(query.trim()))));
  const visible = searched.filter((option) => category === 'todos' || attributeCategory(option) === category);
  const counts = (key: string) => key === 'todos' ? searched.length : searched.filter((option) => attributeCategory(option) === key).length;
  const show = () => { setOpen(true); setQuery(''); setCategory('todos'); setActive(0); };
  const choose = (option: AttributeCatalogOption) => { onChange(String(option.id)); setOpen(false); setQuery(''); toggle.current?.focus(); };
  return <div className="attribute-catalog-select" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setOpen(false); setQuery(''); } }} onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); toggle.current?.focus(); } }}>
    <label htmlFor={`${id}-search`}>Seleccionar atributo del catálogo <b>*</b></label>
    <div className={`attribute-catalog-trigger ${open && !disabled ? 'open' : ''}`}><Search size={17} aria-hidden="true" /><input ref={input} id={`${id}-search`} role="combobox" aria-expanded={open && !disabled} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={open && visible.length ? `${id}-option-${Math.min(active, visible.length - 1)}` : undefined} disabled={disabled} placeholder="Buscar atributo por nombre, tipo o fórmula…" value={open ? query : selected?.nombre || ''} onFocus={() => { if (!open) show(); }} onChange={(event) => { setOpen(true); setQuery(event.target.value); setActive(0); }} onKeyDown={(event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (!open) { show(); return; } const next = Math.max(0, Math.min(visible.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1))); setActive(next); document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: 'nearest' }); }
      if (event.key === 'Enter') { event.preventDefault(); if (!open) show(); else { const option = visible[Math.min(active, visible.length - 1)]; if (option) choose(option); } }
    }} /><button ref={toggle} type="button" aria-label={open ? 'Cerrar catálogo de atributos' : 'Abrir catálogo de atributos'} aria-expanded={open && !disabled} disabled={disabled} onClick={() => { if (open) setOpen(false); else { show(); input.current?.focus(); } }}><ChevronDown size={16} /></button></div>
    {open && !disabled && <div className="attribute-catalog-panel"><nav className="attribute-catalog-categories" aria-label="Categorías de atributos">{categories.map(({ key, label, icon: Icon }) => <button key={key} type="button" className={category === key ? 'selected' : ''} aria-pressed={category === key} onClick={() => { setCategory(key); setActive(0); }}><Icon size={18} /><span>{label}</span><b>{counts(key)}</b></button>)}</nav><div className="attribute-catalog-results"><div className="attribute-catalog-columns"><span>Atributo</span><span>Tipo</span><span>Fórmula / cálculo</span></div><div className="attribute-catalog-list" id={`${id}-list`} role="listbox" aria-label="Atributos disponibles">{visible.map((option, index) => <button type="button" key={option.id} id={`${id}-option-${index}`} role="option" aria-selected={String(option.id) === value} tabIndex={-1} className={`attribute-catalog-option ${index === active ? 'highlighted' : ''} ${String(option.id) === value ? 'selected' : ''}`} onMouseEnter={() => setActive(index)} onClick={() => choose(option)}><span><strong>{option.nombre}</strong><small>{option.descripcion || 'Sin descripción'}</small></span><span><b className="attribute-catalog-type">{option.aplicaA}</b></span><span className="attribute-catalog-formula">{option.tipoFormula}</span></button>)}{!visible.length && <p className="dropdown-no-results">No se encontraron atributos en esta categoría.</p>}</div></div></div>}
  </div>;
}
