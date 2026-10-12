import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, FileText, Info, Pencil, Plus, UserRound, X } from 'lucide-react';
import type { CreditosCatalogs, SimulacionCredito } from '../../api';
import { FeedbackAlert, type FeedbackTone } from '../../FeedbackAlert';

export type CreditRequestForm = {
  idProductoCredito: string; idLibranzera: string; idEmpresa: string; idEmpleadoEmpresa: string; idComercial: string;
  identificacionCliente: string; nombreCliente: string; correoCliente: string; telefonoCliente: string;
  montoSolicitado: string; plazo: string; tasa: string;
};
type Props = {
  value: CreditRequestForm; catalogs: CreditosCatalogs; busy: boolean; simulation: SimulacionCredito | null;
  message: string; messageTone: FeedbackTone; onDismissMessage: () => void;
  onChange: (value: CreditRequestForm) => void; onClose: () => void;
  onSubmit: (event: FormEvent) => void; onSimulate: () => void;
};
const money = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export function CreditRequestDrawer({ value, catalogs, busy, simulation, message, messageTone, onDismissMessage, onChange, onClose, onSubmit, onSimulate }: Props) {
  const [step, setStep] = useState(0);
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? []).filter((element) => element.getClientRects().length > 0);
      const first = controls[0]; const last = controls.at(-1);
      if (!first) { event.preventDefault(); panel.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [busy, onClose]);
  const update = (key: keyof CreditRequestForm, content: string) => onChange({ ...value, [key]: content });
  const next = () => { if (form.current?.reportValidity()) setStep((current) => Math.min(2, current + 1)); };
  const name = (key: 'productos' | 'libranzeras' | 'empresas' | 'empleados' | 'comerciales', selected: string) => catalogs[key].find((item) => String(item.id) === selected)?.nombre ?? 'No seleccionado';
  const select = (key: keyof CreditRequestForm, label: string, catalog: 'productos' | 'libranzeras' | 'empresas' | 'empleados' | 'comerciales', required = false) => <label className="request-drawer-field"><span>{label}{required && <b> *</b>}</span><select value={value[key]} required={required} onChange={(event) => update(key, event.target.value)}><option value="">Selecciona una opción</option>{catalogs[catalog].map((item) => <option value={item.id} key={item.id}>{item.nombre}</option>)}</select></label>;
  const summary = (title: string, fields: [string, string][], target: number) => <article className="request-summary-card"><header><h3>{title}</h3><button type="button" disabled={busy} onClick={() => setStep(target)}><Pencil size={12} />Editar</button></header><dl>{fields.map(([label, content]) => <div key={label}><dt>{label}</dt><dd>{content}</dd></div>)}</dl></article>;
  return createPortal(<div className="request-drawer-overlay" onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="request-drawer" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={panel} tabIndex={-1}>
      <header className="request-drawer-heading"><div><h2 id={`${id}-title`}>Radicar nueva solicitud</h2><p>Completa la información en los siguientes pasos para radicar una nueva solicitud de crédito.</p></div><button ref={closeButton} className="request-drawer-close" type="button" aria-label="Cerrar formulario" disabled={busy} onClick={onClose}><X size={18} /></button></header>
      <ol className="request-drawer-steps">{['Producto y origen', 'Cliente y condiciones', 'Confirmación'].map((label, index) => <li key={label} className={`${step === index ? 'active' : ''} ${step > index ? 'completed' : ''}`}><button type="button" disabled={busy || index > step} aria-current={step === index ? 'step' : undefined} onClick={() => setStep(index)}><span className="request-step-number">{index < step ? <Check size={14} /> : index + 1}</span><span><strong>{label}</strong><small>{index === 0 ? (value.idProductoCredito ? name('productos', value.idProductoCredito) : 'Selecciona el producto') : index === 1 ? (step === 2 ? value.nombreCliente : 'Datos de solicitud y plazo') : 'Revisa y radica la solicitud'}</small></span></button></li>)}</ol>
      <form ref={form} className="request-drawer-form" onSubmit={(event) => { if (step < 2) { event.preventDefault(); next(); } else onSubmit(event); }}>
        <div className="request-drawer-content">
          <fieldset disabled={busy}>
            {step === 0 && <><div className="request-drawer-section-title"><span><FileText size={19} /></span><div><h3>Producto y origen</h3><p>Selecciona el producto de crédito y los datos de origen.</p></div></div><div className="request-drawer-grid two-cols">{select('idProductoCredito', 'Producto de crédito', 'productos', true)}{select('idLibranzera', 'Libranza', 'libranzeras')}{select('idEmpresa', 'Empresa', 'empresas')}{select('idComercial', 'Comercial', 'comerciales')}</div><p className="request-drawer-notice"><Info size={17} />La información del producto se utilizará para la simulación y radicación del crédito.</p></>}
            {step === 1 && <><div className="request-drawer-section-title"><span><UserRound size={19} /></span><div><h3>Información del cliente</h3><p>Ingresa los datos del cliente y las condiciones de la solicitud.</p></div></div><div className="request-drawer-grid">{select('idEmpleadoEmpresa', 'Empleado asociado', 'empleados')}<label className="request-drawer-field"><span>Identificación cliente<b> *</b></span><input required value={value.identificacionCliente} onChange={(event) => update('identificacionCliente', event.target.value)} placeholder="Identificación" /></label><label className="request-drawer-field"><span>Nombre cliente<b> *</b></span><input required value={value.nombreCliente} onChange={(event) => update('nombreCliente', event.target.value)} placeholder="Nombre completo" /></label><label className="request-drawer-field"><span>Teléfono</span><input type="tel" value={value.telefonoCliente} onChange={(event) => update('telefonoCliente', event.target.value)} placeholder="Teléfono" /></label><label className="request-drawer-field"><span>Correo</span><input type="email" value={value.correoCliente} onChange={(event) => update('correoCliente', event.target.value)} placeholder="Correo electrónico" /></label></div><div className="request-drawer-section-title separated"><span><ClipboardCheck size={19} /></span><div><h3>Condiciones de la solicitud</h3><p>Define el monto, plazo y tasa para simular el crédito.</p></div></div><div className="request-drawer-grid"><label className="request-drawer-field"><span>Monto solicitado<b> *</b></span><input type="number" min="1" step="0.01" required value={value.montoSolicitado} onChange={(event) => update('montoSolicitado', event.target.value)} placeholder="$ 0" /></label><label className="request-drawer-field"><span>Plazo<b> *</b></span><select required value={value.plazo} onChange={(event) => update('plazo', event.target.value)}><option value="">Selecciona un plazo</option>{Array.from({ length: 60 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{month} meses</option>)}</select></label><label className="request-drawer-field"><span>Tasa de interés (%)</span><input type="number" min="0" step="any" value={value.tasa} onChange={(event) => update('tasa', event.target.value)} placeholder="Tasa del producto" /></label></div><div className="request-simulation-action"><button type="button" className="requests-button secondary" disabled={busy} onClick={() => { if (form.current?.reportValidity()) onSimulate(); }}>Simular crédito</button>{simulation && <span>Cuota estimada <strong>{money(simulation.resumen.cuotaEstimada)}</strong></span>}</div></>}
            {step === 2 && <><div className="request-drawer-section-title"><span><ClipboardCheck size={19} /></span><div><h3>Resumen de la solicitud</h3><p>Revisa la información antes de radicar la solicitud de crédito.</p></div></div><div className="request-summary-grid">{summary('Producto y origen', [['Producto de crédito', name('productos', value.idProductoCredito)], ['Libranza', name('libranzeras', value.idLibranzera)], ['Empresa', name('empresas', value.idEmpresa)], ['Comercial', name('comerciales', value.idComercial)]], 0)}{summary('Cliente', [['Empleado asociado', name('empleados', value.idEmpleadoEmpresa)], ['Nombre', value.nombreCliente], ['Identificación', value.identificacionCliente], ['Teléfono', value.telefonoCliente || '—'], ['Correo', value.correoCliente || '—']], 1)}{summary('Condiciones de la solicitud', [['Monto solicitado', money(Number(value.montoSolicitado))], ['Plazo', `${value.plazo} meses`], ['Tasa de interés', value.tasa ? `${value.tasa}%` : 'Según producto'], ['Cuota estimada', simulation ? money(simulation.resumen.cuotaEstimada) : 'Pendiente de simulación']], 1)}</div><p className="request-drawer-notice warning"><Info size={17} />Al radicar la solicitud, se generará un consecutivo y quedará registrada en el sistema para su validación.</p>{simulation?.evaluacion && <div className={`capacity-panel ${simulation.evaluacion.aprobado ? 'approved' : 'blocked'}`}><strong>{simulation.evaluacion.aprobado ? 'Capacidad aprobada' : 'Revisa la evaluación de capacidad'}</strong>{[...simulation.evaluacion.bloqueos, ...simulation.evaluacion.alertas].map((item) => <small key={item}>{item}</small>)}</div>}</>}
          </fieldset>
          <FeedbackAlert message={message} tone={messageTone} onDismiss={onDismissMessage} />
        </div>
        <footer className="request-drawer-footer">{step > 0 ? <button type="button" className="requests-button secondary" disabled={busy} onClick={() => setStep(step - 1)}><ArrowLeft size={14} />Anterior</button> : <button type="button" className="requests-button secondary" disabled={busy} onClick={onClose}>Cancelar</button>}<div>{step === 2 && <button type="button" className="requests-button secondary" disabled={busy} onClick={onClose}>Cancelar</button>}{step < 2 ? <button type="button" className="requests-button" disabled={busy} onClick={next}>Siguiente<ArrowRight size={14} /></button> : <button type="submit" className="requests-button submit" disabled={busy}><Plus size={14} />{busy ? 'Radicando…' : 'Radicar solicitud'}</button>}</div></footer>
      </form>
    </div>
  </div>, document.body);
}
