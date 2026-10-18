import { useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export type DropdownOption = { value: string; label: string; count?: number; icon?: ReactNode; tone?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'cyan' };

type Props = { label: string; value: string; options: DropdownOption[]; onChange: (value: string) => void; searchPlaceholder?: string; disabled?: boolean };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

export function SearchableDropdown({ label, value, options, onChange, searchPlaceholder = 'Buscar opción…', disabled = false }: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const visible = options.filter((option) => normalize(option.label).includes(normalize(query.trim())));
  const selected = options.find((option) => option.value === value);
  const close = () => { setOpen(false); setQuery(''); setActive(0); };
  const choose = (option: DropdownOption) => { onChange(option.value); close(); trigger.current?.focus(); };

  return (
    <div className={`searchable-dropdown ${open ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }} onKeyDown={(event) => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(); trigger.current?.focus(); }
    }}>
      <button ref={trigger} type="button" className="dropdown-trigger" disabled={disabled} aria-expanded={open} aria-haspopup="listbox" aria-controls={`${id}-list`} aria-label={`${label}: ${selected?.label ?? 'Selecciona una opción'}`} onClick={() => { if (disabled) return; if (open) close(); else { setQuery(''); setActive(0); setOpen(true); } }} onKeyDown={(event) => { if (disabled) return; if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); setActive(0); } }}>
        <span><small>{label}</small><strong>{selected?.label ?? 'Selecciona una opción'}</strong></span><ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && !disabled && <div className="dropdown-panel">
        <label className="dropdown-search"><Search size={15} aria-hidden="true" /><input autoFocus role="combobox" aria-label={`Buscar ${label.toLocaleLowerCase()}`} aria-expanded={true} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={visible.length ? `${id}-option-${Math.min(active, visible.length - 1)}` : undefined} value={query} placeholder={searchPlaceholder} onChange={(event) => { setQuery(event.target.value); setActive(0); }} onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const next = Math.max(0, Math.min(visible.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1)));
            setActive(next);
            document.getElementById(`${id}-option-${next}`)?.scrollIntoView({ block: 'nearest' });
          }
          if (event.key === 'Enter') { event.preventDefault(); const option = visible[Math.min(active, visible.length - 1)]; if (option) choose(option); }
        }} /></label>
        <div className="dropdown-options" role="listbox" id={`${id}-list`} aria-label={label}>
          {visible.map((option, index) => <button key={option.value} id={`${id}-option-${index}`} type="button" tabIndex={-1} role="option" aria-selected={option.value === value} className={`dropdown-option ${option.value === value ? 'selected' : ''} ${index === active ? 'highlighted' : ''}`} onMouseEnter={() => setActive(index)} onClick={() => choose(option)}>
            {option.icon && <span className={`dropdown-option-icon ${option.tone ?? 'blue'}`}>{option.icon}</span>}<span className="dropdown-option-label">{option.label}</span>{option.count !== undefined && <span className={`dropdown-option-count ${option.tone ?? 'blue'}`}>{option.count}</span>}
          </button>)}
          {!visible.length && <p className="dropdown-no-results">No se encontraron opciones</p>}
        </div>
      </div>}
    </div>
  );
}
