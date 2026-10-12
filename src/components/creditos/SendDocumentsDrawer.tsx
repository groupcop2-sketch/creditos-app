import { useEffect, useId, useRef, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { FileText, IdCard, Info, Mail, Phone, Send, UserRound, X } from 'lucide-react';
import { FeedbackAlert, type FeedbackTone } from '../../FeedbackAlert';

export type SendDocumentsForm = {
  firmanteNombre: string; firmanteCorreo: string; firmanteTelefono: string; firmanteIdentificacion: string;
  asunto: string; mensaje: string; includeContrato: boolean; includeAutorizacion: boolean; includePagare: boolean; includeSeguroVida: boolean;
};
type Props = {
  value: SendDocumentsForm; creditNumber: string; busy: boolean; message: string; messageTone: FeedbackTone;
  onChange: (value: SendDocumentsForm) => void; onClose: () => void; onSubmit: (event: FormEvent) => void; onDismissMessage: () => void;
};

export function SendDocumentsDrawer({ value, creditNumber, busy, message, messageTone, onChange, onClose, onSubmit, onDismissMessage }: Props) {
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
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (!first) { event.preventDefault(); panel.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown); return () => document.removeEventListener('keydown', keydown);
  }, [busy, onClose]);
  const documents = [
    { key: 'includeContrato', title: 'Contrato de mutuo', subtitle: 'con descuento', tone: 'blue' },
    { key: 'includePagare', title: 'Pagaré en blanco', subtitle: 'con carta', tone: 'green' },
    { key: 'includeAutorizacion', title: 'Autorización de descuento', subtitle: 'por nómina', tone: 'purple' },
    { key: 'includeSeguroVida', title: 'Seguro de vida', subtitle: 'deudores', tone: 'orange' }
  ] as const;
  const selectedCount = documents.filter((document) => value[document.key]).length;
  return createPortal(<div className="request-drawer-overlay" onClick={(event) => { if (event.currentTarget === event.target && !busy) onClose(); }}>
    <div className="request-drawer send-documents-drawer" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
      <header className="request-drawer-heading"><span className="send-drawer-heading-icon"><Send size={25} /></span><div><h2 id={`${id}-title`}>Enviar documentos para firma electrónica</h2><p>Crédito #{creditNumber}<br />Se enviará al correo del cliente</p></div><button ref={closeButton} type="button" className="request-drawer-close" aria-label="Cerrar envío de documentos" disabled={busy} onClick={onClose}><X size={18} /></button></header>
      <form className="request-drawer-form" onSubmit={onSubmit}>
        <div className="request-drawer-content"><fieldset disabled={busy}>
          <section className="send-drawer-section"><div className="send-drawer-section-heading"><span>1</span><div><h3>Información del cliente</h3><p>Verifica y completa los datos del cliente que recibirá el correo.</p></div></div>
            <div className="send-drawer-client"><span><UserRound size={23} /></span><div><strong>{value.firmanteNombre || 'Cliente / firmante'}</strong><small>{value.firmanteIdentificacion || 'Sin identificación'}</small></div><b>CLIENTE</b></div>
            <div className="request-drawer-grid two-cols">
              <label className="request-drawer-field"><span>Nombre del cliente / firmante<b> *</b></span><div className="send-drawer-input"><UserRound size={15} /><input required value={value.firmanteNombre} onChange={(event) => onChange({ ...value, firmanteNombre: event.target.value })} /></div></label>
              <label className="request-drawer-field"><span>Cédula / Identificación<b> *</b></span><div className="send-drawer-input"><IdCard size={15} /><input required value={value.firmanteIdentificacion} onChange={(event) => onChange({ ...value, firmanteIdentificacion: event.target.value })} /></div></label>
              <label className="request-drawer-field"><span>Correo electrónico del cliente (receptor)<b> *</b></span><div className="send-drawer-input"><Mail size={15} /><input type="email" required value={value.firmanteCorreo} onChange={(event) => onChange({ ...value, firmanteCorreo: event.target.value })} /></div></label>
              <label className="request-drawer-field"><span>Teléfono móvil</span><div className="send-drawer-input"><Phone size={15} /><input type="tel" value={value.firmanteTelefono} onChange={(event) => onChange({ ...value, firmanteTelefono: event.target.value })} /></div></label>
            </div>
          </section>
          <section className="send-drawer-section"><div className="send-drawer-section-heading"><span>2</span><div><h3>Asunto del correo</h3><p>Este será el asunto que verá el cliente en su correo electrónico.</p></div></div><label className="send-drawer-input"><Mail size={16} /><input aria-label="Asunto del correo" required maxLength={120} value={value.asunto} onChange={(event) => onChange({ ...value, asunto: event.target.value })} /></label><small className="send-drawer-counter">{value.asunto.length}/120</small></section>
          <section className="send-drawer-section"><div className="send-drawer-section-heading"><span>3</span><div><h3>Documentos incluidos en el paquete digital</h3><p>Selecciona los documentos que se enviarán para firma electrónica.</p></div></div><div className="send-drawer-document-grid">{documents.map((document) => <label className="send-drawer-document" key={document.key}><input type="checkbox" checked={value[document.key]} onChange={(event) => onChange({ ...value, [document.key]: event.target.checked })} /><span className={`dropdown-option-icon ${document.tone}`}><FileText size={20} /></span><span><strong>{document.title}</strong><small>{document.subtitle}</small></span></label>)}</div>{!selectedCount && <p className="send-drawer-selection-error" role="status">Selecciona al menos un documento para enviar.</p>}<p className="request-drawer-notice"><Info size={17} /><span>Al enviar, el cliente recibirá el paquete para firma electrónica y se activará el seguimiento del envío.</span></p></section>
        </fieldset><FeedbackAlert message={message} tone={messageTone} onDismiss={onDismissMessage} /></div>
        <footer className="request-drawer-footer"><button type="button" className="requests-button secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="requests-button" disabled={busy || !selectedCount}><Send size={16} />{busy ? 'Enviando documentos…' : 'Enviar documentos al cliente'}</button></footer>
      </form>
    </div>
  </div>, document.body);
}
