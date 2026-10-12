import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Package, X } from 'lucide-react';
import { FeedbackAlert, type FeedbackTone } from '../../FeedbackAlert';

export function ProductFormDrawer({ editing, busy, children, message, messageTone, onClose, onDismissMessage }: { editing: boolean; busy: boolean; children: ReactNode; message: string; messageTone: FeedbackTone; onClose: () => void; onDismissMessage: () => void }) {
  const id = useId(); const panel = useRef<HTMLDivElement>(null); const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; close.current?.focus(); return () => { document.body.style.overflow = overflow; previous?.focus(); }; }, []);
  useEffect(() => { const handle = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
    if (event.key === 'Tab') {
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (!first) { event.preventDefault(); panel.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
  }; document.addEventListener('keydown', handle); return () => document.removeEventListener('keydown', handle); }, [onClose, busy]);
  return createPortal(<div className="request-drawer-overlay" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}><div className="request-drawer product-form-drawer" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}><header className="request-drawer-heading"><span className="send-drawer-heading-icon"><Package size={25} /></span><div><h2 id={`${id}-title`}>{editing ? 'Editar producto de crédito' : 'Nuevo producto de crédito'}</h2><p>Configura los parámetros, reglas y formatos del producto de crédito.</p></div><button ref={close} type="button" className="request-drawer-close" disabled={busy} aria-label="Cerrar formulario de producto" onClick={onClose}><X size={18} /></button></header><FeedbackAlert message={message} tone={messageTone} onDismiss={onDismissMessage} />{children}</div></div>, document.body);
}
