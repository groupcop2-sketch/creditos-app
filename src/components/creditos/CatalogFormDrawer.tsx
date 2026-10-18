import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, ClipboardList, Save, Settings2, Users, X } from 'lucide-react';
import { FeedbackAlert, type FeedbackTone } from '../../FeedbackAlert';

export function CatalogSectionHeader({ title, description, kind = 'info' }: { title: string; description: string; kind?: 'info' | 'calculation' | 'additional' }) {
  const Icon = kind === 'calculation' ? Calculator : kind === 'additional' ? Users : ClipboardList;
  return <div className="catalog-section-heading"><span><Icon size={20} /></span><div><h3>{title}</h3><p>{description}</p></div></div>;
}
type Props = { kind: 'attribute' | 'formula' | 'agreement' | 'document'; editing: boolean; busy: boolean; children: ReactNode; message: string; messageTone: FeedbackTone; onDismissMessage: () => void; onClose: () => void; onSubmit: (event: FormEvent) => void };
export function CatalogFormDrawer({ kind, editing, busy, children, message, messageTone, onDismissMessage, onClose, onSubmit }: Props) {
  const id = useId(); const panel = useRef<HTMLDivElement>(null); const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; close.current?.focus(); return () => { document.body.style.overflow = overflow; previous?.focus(); }; }, []);
  useEffect(() => { const listener = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
    if (event.key !== 'Tab') return;
    const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') ?? []).filter((element) => element.getClientRects().length > 0);
    const first = controls[0]; const last = controls.at(-1);
    if (!first) { event.preventDefault(); panel.current?.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  }; document.addEventListener('keydown', listener); return () => document.removeEventListener('keydown', listener); }, [busy, onClose]);
  const titles = {
    agreement: { title: editing ? 'Editar convenio' : 'Agregar convenio', description: 'Selecciona una empresa pagadora y configura su convenio con el producto.', action: 'Guardar convenio' },
    attribute: { title: editing ? 'Editar atributo maestro' : 'Registrar atributo maestro', description: 'Define un atributo del catálogo con su fórmula, cálculo y configuración general.', action: 'Guardar atributo' },
    formula: { title: editing ? 'Editar fórmula de cálculo' : 'Crear nueva fórmula de cálculo', description: 'Define y parametriza los tipos de fórmulas utilizados en la liquidación de créditos y atributos.', action: 'Guardar fórmula' },
    document: { title: editing ? 'Editar documento del producto' : 'Asignar documento al producto', description: 'Selecciona un documento de la biblioteca y define prioridad, alcance y requisitos.', action: 'Guardar documento' }
  } as const;
  const meta = titles[kind];
  return createPortal(<div className="request-drawer-overlay" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><div className={`request-drawer catalog-form-drawer ${kind}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={panel} tabIndex={-1}>
    <header className="request-drawer-heading"><div><h2 id={`${id}-title`}>{meta.title}</h2><p>{meta.description}</p></div><button ref={close} type="button" className="request-drawer-close" disabled={busy} aria-label="Cerrar formulario del catálogo" onClick={onClose}><X size={18} /></button></header>
    <form className="request-drawer-form" onSubmit={onSubmit}><div className="request-drawer-content"><FeedbackAlert message={message} tone={messageTone} onDismiss={onDismissMessage} /><fieldset disabled={busy}>{children}</fieldset></div><footer className="request-drawer-footer"><button type="button" className="requests-button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="requests-button" disabled={busy}><Save size={15} />{busy ? 'Guardando…' : meta.action}</button></footer></form>
  </div></div>, document.body);
}
