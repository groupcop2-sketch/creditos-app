import React, { useEffect, useState } from 'react';
import { FileText, Mail, Send, Eye, AlertTriangle, Building2, CheckCircle2, Circle, PenLine } from 'lucide-react';
import { api, type AprobacionEmpresaInput, type VisacionExtras, type VisacionInfo } from '../../api';
import { openDocument } from '../DocumentViewer';

type Props = {
  token: string;
  creditoId: number;
  readOnly?: boolean;
  formatMoney: (val?: number | null) => string;
  formatDateTime: (val?: string | null) => string;
  /** Reports whether the client signature step is unlocked (employer approved, or not a payroll loan). */
  onFirmaHabilitadaChange?: (habilitada: boolean) => void;
};

const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
const fechaLarga = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
  reader.readAsDataURL(file);
});

const openBlob = (blob: Blob) => openDocument(blob, 'carta-visacion.pdf');

/**
 * Visación: formal letter to the employer approving the payroll deduction (PDF, emailed from the app),
 * then the employer's approval (date + who). Only after that the documents go to the client for signature.
 */
export const VisacionPanel: React.FC<Props> = ({ token, creditoId, readOnly = false, formatMoney, formatDateTime, onFirmaHabilitadaChange }) => {
  const [info, setInfo] = useState<VisacionInfo | null>(null);
  const [extras, setExtras] = useState<VisacionExtras>({ ciudad: '', entidadFinanciera: '', entidadOperadora: '', firmanteNombre: '', firmanteCargo: '' });
  const [para, setPara] = useState('');
  const [copia, setCopia] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busy, setBusy] = useState<'preview' | 'send' | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [aprob, setAprob] = useState<AprobacionEmpresaInput>({ fechaAprobacion: hoy(), aprobadoPor: '', cargo: '', observacion: '' });
  const [aprobFile, setAprobFile] = useState<File | null>(null);
  const [savingAprob, setSavingAprob] = useState(false);

  useEffect(() => {
    api.getVisacion(token, creditoId)
      .then((data) => {
        setInfo(data);
        const { para: sugerido, ...rest } = data.sugerencias;
        setExtras(rest);
        setPara(sugerido);
        onFirmaHabilitadaChange?.(!data.requiereAprobacionEmpresa || Boolean(data.aprobacionEmpresa));
      })
      .catch((err) => setFeedback({ ok: false, text: err instanceof Error ? err.message : 'No se pudo cargar la información de visación' }));
  }, [token, creditoId]);

  const set = (key: keyof VisacionExtras) => (event: React.ChangeEvent<HTMLInputElement>) => setExtras((current) => ({ ...current, [key]: event.target.value }));

  const preview = async () => {
    setBusy('preview');
    setFeedback(null);
    try { openBlob(await api.previewVisacion(token, creditoId, extras)); }
    catch (err) { setFeedback({ ok: false, text: err instanceof Error ? err.message : 'No se pudo generar la carta' }); }
    finally { setBusy(null); }
  };

  const enviar = async () => {
    setBusy('send');
    setFeedback(null);
    try {
      const res = await api.enviarVisacion(token, creditoId, { para, copia: copia || undefined, mensaje: mensaje || undefined, extras });
      setInfo((current) => (current ? { ...current, visaciones: res.visaciones } : current));
      setFeedback({ ok: res.enviado, text: res.detalle });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'No se pudo enviar la carta' });
    } finally {
      setBusy(null);
    }
  };

  const registrarAprobacion = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingAprob(true);
    setFeedback(null);
    try {
      if (aprobFile && aprobFile.size > 8 * 1024 * 1024) throw new Error('El soporte supera 8 MB');
      const archivo = aprobFile ? { nombre: aprobFile.name, mimeType: aprobFile.type, base64: await fileToBase64(aprobFile) } : null;
      const registro = await api.registrarAprobacionEmpresa(token, creditoId, { ...aprob, cargo: aprob.cargo || null, observacion: aprob.observacion || null, archivo });
      setInfo((current) => (current ? { ...current, aprobacionEmpresa: registro } : current));
      onFirmaHabilitadaChange?.(true);
      setFeedback({ ok: true, text: 'Aprobación de la empresa registrada. Ya puedes enviar los documentos a firma del cliente.' });
    } catch (err) {
      setFeedback({ ok: false, text: err instanceof Error ? err.message : 'No se pudo registrar la aprobación' });
    } finally {
      setSavingAprob(false);
    }
  };

  if (!info) return <div className="estudio-panel">{feedback ? <p className="estudio-error" role="alert">{feedback.text}</p> : <p className="muted-note">Cargando información de visación…</p>}</div>;

  const d = info.datos;
  const ultimaEnviada = info.visaciones.find((item) => item.enviado);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(para);
  const aprobada = info.aprobacionEmpresa;

  return (
    <section className="estudio-panel" aria-labelledby="visacion-title">
      <header className="estudio-header">
        <div>
          <h3 id="visacion-title"><FileText size={18} aria-hidden="true" /> Carta de visación a la empresa</h3>
          <p>Aprobación y autorización de descuento por libranza (Ley 1527 de 2012). Se envía en PDF a la pagaduría para que la firme y la devuelva.</p>
        </div>
        {ultimaEnviada && <span className="chip ok">Enviada {formatDateTime(ultimaEnviada.fecha)}</span>}
      </header>

      {info.requiereAprobacionEmpresa && (
        <ol className="visacion-pasos" aria-label="Pasos de la visación">
          <li className={info.visaciones.length ? 'done' : 'current'}>
            {info.visaciones.length ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />} 1. Carta enviada a la empresa
          </li>
          <li className={aprobada ? 'done' : info.visaciones.length ? 'current' : ''}>
            {aprobada ? <CheckCircle2 size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />} 2. La empresa aprueba
          </li>
          <li className={aprobada ? 'current' : ''}>
            <PenLine size={16} aria-hidden="true" /> 3. Documentos a firma del cliente
          </li>
        </ol>
      )}

      <div className="soportes-modalidad">
        <div><span>Empresa</span><strong>{d.empresa || '—'}</strong></div>
        <div><span>NIT</span><strong>{d.nit || '—'}</strong></div>
        <div><span>Trabajador</span><strong>{d.trabajador} · {d.cedula}</strong></div>
        <div><span>Préstamo</span><strong>{formatMoney(d.monto)}</strong></div>
        <div><span>Cuota</span><strong>{formatMoney(d.cuota)}</strong></div>
        <div><span>Plazo</span><strong>{d.plazo} meses</strong></div>
      </div>
      {!info.usaDecision && <p className="muted-note">Los valores son los solicitados; cuando registres la decisión del crédito, la carta usará el monto, plazo y cuota aprobados.</p>}
      {info.faltantes.length > 0 && (
        <p className="estudio-verdict bad"><AlertTriangle size={16} aria-hidden="true" /> Faltan datos en la ficha: {info.faltantes.join(', ')}. Saldrán como [campo] en la carta.</p>
      )}

      {!readOnly && !aprobada && (
        <>
          <div className="visacion-grid">
            <label className="estudio-field"><span>Para (correo de la empresa)</span><input className="visacion-input" type="email" value={para} onChange={(e) => setPara(e.target.value)} /></label>
            <label className="estudio-field"><span>Copia (opcional)</span><input className="visacion-input" type="email" value={copia} onChange={(e) => setCopia(e.target.value)} /></label>
            <label className="estudio-field"><span>Ciudad de la carta</span><input className="visacion-input" value={extras.ciudad} onChange={set('ciudad')} /></label>
            <label className="estudio-field"><span>Dirigida a (entidad financiera)</span><input className="visacion-input" value={extras.entidadFinanciera} onChange={set('entidadFinanciera')} /></label>
            <label className="estudio-field"><span>Recursos a favor de (entidad operadora)</span><input className="visacion-input" value={extras.entidadOperadora} onChange={set('entidadOperadora')} /></label>
            <label className="estudio-field"><span>Firma: nombre</span><input className="visacion-input" value={extras.firmanteNombre} onChange={set('firmanteNombre')} /></label>
            <label className="estudio-field"><span>Firma: cargo</span><input className="visacion-input" value={extras.firmanteCargo} onChange={set('firmanteCargo')} /></label>
          </div>
          <label className="estudio-field estudio-obs"><span>Mensaje adicional en el correo (opcional)</span><textarea rows={2} maxLength={2000} value={mensaje} onChange={(e) => setMensaje(e.target.value)} /></label>
          <div className="estudio-actions" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="stage-btn-outline" disabled={busy !== null} onClick={preview}><Eye size={14} aria-hidden="true" /> {busy === 'preview' ? 'Generando…' : 'Vista previa PDF'}</button>
            <button type="button" className="stage-btn-primary" disabled={busy !== null || !emailOk} onClick={enviar}><Send size={14} aria-hidden="true" /> {busy === 'send' ? 'Enviando…' : 'Enviar a la empresa'}</button>
          </div>
        </>
      )}
      {feedback && <p className={`estudio-verdict ${feedback.ok ? 'ok' : 'bad'}`} role="status">{feedback.text}</p>}

      {info.visaciones.length > 0 && (
        <div className="estudio-history">
          <h4>Cartas generadas</h4>
          <ul>
            {info.visaciones.map((item) => (
              <li key={item.id}>
                <span className={`chip ${item.enviado ? 'ok' : 'warn'}`}>{item.enviado ? 'Enviada' : 'Sin enviar'}</span>
                <span><Mail size={12} aria-hidden="true" /> {item.destinatario}</span>
                <button type="button" className="estudio-link" onClick={() => api.getVisacionPdf(token, item.id).then(openBlob).catch(() => setFeedback({ ok: false, text: 'No se pudo abrir la carta' }))}>Ver PDF</button>
                <small>{formatDateTime(item.fecha)}{item.usuario ? ` · ${item.usuario}` : ''}{item.detalle ? ` · ${item.detalle}` : ''}</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {info.requiereAprobacionEmpresa && (
        <div className="visacion-aprobacion">
          <h4><Building2 size={16} aria-hidden="true" /> Aprobación de la empresa</h4>
          {aprobada ? (
            <div className="visacion-aprobada" role="status">
              <CheckCircle2 size={18} aria-hidden="true" />
              <div>
                <strong>Aprobado por la empresa el {fechaLarga(aprobada.fechaAprobacion)}</strong>
                <span>{aprobada.aprobadoPor}{aprobada.cargo ? ` · ${aprobada.cargo}` : ''}</span>
                {aprobada.observacion && <span>{aprobada.observacion}</span>}
                <small>Registrado {formatDateTime(aprobada.fechaRegistro)}{aprobada.usuario ? ` por ${aprobada.usuario}` : ''}</small>
              </div>
              {aprobada.nombreArchivo && (
                <button
                  type="button"
                  className="estudio-link"
                  onClick={() => api.getAprobacionEmpresaArchivo(token, aprobada.id).then((blob) => openDocument(blob, aprobada.nombreArchivo ?? 'aprobacion-empresa')).catch(() => setFeedback({ ok: false, text: 'No se pudo abrir el soporte' }))}
                >
                  Ver soporte
                </button>
              )}
            </div>
          ) : readOnly ? (
            <p className="muted-note">No se registró aprobación de la empresa.</p>
          ) : !info.visaciones.length ? (
            <p className="muted-note">Primero envía la carta a la empresa. Cuando la empresa la apruebe, registra aquí la fecha.</p>
          ) : (
            <form className="visacion-grid" onSubmit={registrarAprobacion}>
              <label className="estudio-field"><span>Fecha en que la empresa aprobó *</span><input className="visacion-input" type="date" required max={hoy()} value={aprob.fechaAprobacion} onChange={(e) => setAprob({ ...aprob, fechaAprobacion: e.target.value })} /></label>
              <label className="estudio-field"><span>Aprobado por (nombre) *</span><input className="visacion-input" required minLength={3} maxLength={200} value={aprob.aprobadoPor} onChange={(e) => setAprob({ ...aprob, aprobadoPor: e.target.value })} /></label>
              <label className="estudio-field"><span>Cargo</span><input className="visacion-input" maxLength={120} value={aprob.cargo ?? ''} onChange={(e) => setAprob({ ...aprob, cargo: e.target.value })} /></label>
              <label className="estudio-field"><span>Carta firmada por la empresa (PDF o imagen, opcional)</span><input className="visacion-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setAprobFile(e.target.files?.[0] ?? null)} /></label>
              <label className="estudio-field visacion-span"><span>Observación</span><input className="visacion-input" maxLength={1000} value={aprob.observacion ?? ''} onChange={(e) => setAprob({ ...aprob, observacion: e.target.value })} /></label>
              <div className="estudio-actions visacion-span" style={{ justifyContent: 'flex-end' }}>
                <button type="submit" className="stage-btn-primary" disabled={savingAprob}><CheckCircle2 size={14} aria-hidden="true" /> {savingAprob ? 'Guardando…' : 'Registrar aprobación de la empresa'}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </section>
  );
};
