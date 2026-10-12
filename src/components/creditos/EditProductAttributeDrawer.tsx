import { useEffect, useId, useRef, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Info, Package, X } from 'lucide-react';
import { FeedbackAlert, type FeedbackTone } from '../../FeedbackAlert';

type Values = { valor: string; porcentaje: string; minimo: string; maximo: string; aplicaIva: boolean; obligatorio: boolean };
type Props = {
  name: string; description: string; type: string; value: Values; busy: boolean;
  message: string; messageTone: FeedbackTone; onDismissMessage: () => void;
  onChange: (patch: Partial<Values>) => void; onClose: () => void; onSubmit: (event: FormEvent) => void;
};
export function EditProductAttributeDrawer({ name, description, type, value, busy, message, messageTone, onDismissMessage, onChange, onClose, onSubmit }: Props) {
  const id = useId(); const panel = useRef<HTMLDivElement>(null); const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; close.current?.focus(); return () => { document.body.style.overflow = overflow; previous?.focus(); }; }, []);
  useEffect(() => { const handle = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
    if (event.key === 'Tab') {
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (!first) { event.preventDefault(); panel.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  }; document.addEventListener('keydown', handle); return () => document.removeEventListener('keydown', handle); }, [busy, onClose]);
  const amount = (key: 'valor' | 'minimo' | 'maximo', label: string) => <label className="request-drawer-field"><span>{label}</span><div className="attribute-value-input"><span>$</span><input type="number" min="0" step="any" value={value[key]} placeholder="0" onChange={(event) => onChange({ [key]: event.target.value, ...(key === 'valor' && event.target.value.trim() ? { porcentaje: '' } : {}) })} /></div></label>;
  return createPortal(<div className="request-drawer-overlay" onClick={(event) => { if (event.currentTarget === event.target && !busy) onClose(); }}><div className="request-drawer edit-attribute-drawer" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={panel} tabIndex={-1}>
    <header className="request-drawer-heading"><div><h2 id={`${id}-title`}>Editar atributo</h2><p>Modifica la configuración del atributo asignado al producto.</p></div><button ref={close} type="button" className="request-drawer-close" aria-label="Cerrar edición de atributo" disabled={busy} onClick={onClose}><X size={18} /></button></header>
    <form className="request-drawer-form" onSubmit={onSubmit}><div className="request-drawer-content">
      <section className="edit-attribute-summary"><span className="send-drawer-heading-icon"><Package size={22} /></span><div><h3>{name}</h3><p>{description || 'Atributo asignado al producto.'}</p></div><div className="edit-attribute-type"><small>Tipo</small><b>{type || '—'}</b></div></section>
      <fieldset disabled={busy}><section className="edit-attribute-section"><h3>Configuración de valores</h3><div className="request-drawer-grid two-cols">{amount('valor', 'Valor')}<label className="request-drawer-field"><span>Porcentaje (%)</span><input type="number" min="0" step="any" value={value.porcentaje} placeholder="0" onChange={(event) => onChange({ porcentaje: event.target.value, ...(event.target.value.trim() ? { valor: '' } : {}) })} /></label>{amount('minimo', 'Mínimo')}{amount('maximo', 'Máximo')}</div></section>
      <section className="edit-attribute-section"><h3>Opciones adicionales</h3><label className="edit-attribute-checkbox"><input type="checkbox" checked={value.aplicaIva} onChange={(event) => onChange({ aplicaIva: event.target.checked })} /><span><strong>Aplica IVA</strong><small>Indica si este atributo genera IVA.</small></span></label><label className="edit-attribute-checkbox"><input type="checkbox" checked={value.obligatorio} onChange={(event) => onChange({ obligatorio: event.target.checked })} /><span><strong>Obligatorio</strong><small>El atributo es obligatorio para el producto.</small></span></label></section></fieldset>
      <p className="request-drawer-notice"><Info size={20} /><span><strong>Estos valores se aplicarán únicamente al producto</strong><br />La configuración del atributo en el catálogo no se verá afectada.</span></p><FeedbackAlert message={message} tone={messageTone} onDismiss={onDismissMessage} />
    </div><footer className="request-drawer-footer"><button type="button" className="requests-button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="requests-button" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button></footer></form>
  </div></div>, document.body);
}
