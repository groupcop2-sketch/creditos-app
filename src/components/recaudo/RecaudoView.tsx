import React, { useCallback, useEffect, useState } from 'react';
import { FileDown, FileText, Mail, Receipt, Send } from 'lucide-react';
import { api, type CuentaEgresoRow } from '../../api';
import { openDocument } from '../DocumentViewer';
import { ESTADO, fecha, money, nombrePeriodo, recaudoApi, type CuentaCobroDetalle, type DetalleCobro, type ResumenPeriodo } from './recaudo.api';
import { descargar, EmpresaSelect, errorMsg, MotivoBox, Pill, TablaDetalle, type Ctx, type Notify, type Tab } from './recaudo.shared';
import { CargaTab, FormatosTab } from './RecaudoArchivos';
import { CierreTab } from './RecaudoCierre';

const TABS: Array<[Tab, string, string]> = [
  ['resumen', 'Resumen del mes', 'recaudo:read'],
  ['cobro', 'Cuentas de cobro', 'recaudo:read'],
  ['carga', 'Cargar pagos', 'recaudo:aplicar'],
  ['formatos', 'Formatos por empresa', 'recaudo:config'],
  ['cierre', 'Cierre del mes', 'recaudo:read']
];

const periodoActual = () => new Date().toISOString().slice(0, 7);
function periodos() {
  const [y, m] = periodoActual().split('-').map(Number);
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 + 1 - i, 1));
    return d.toISOString().slice(0, 7);
  });
}

/** Payroll collection module: notices per company, payment files, reconciliation and monthly close. */
export const RecaudoView: React.FC<{ token: string; notify: Notify; permisos: string[] }> = ({ token, notify, permisos }) => {
  const [tab, setTab] = useState<Tab>('resumen');
  const [periodo, setPeriodo] = useState(periodoActual());
  const [resumen, setResumen] = useState<ResumenPeriodo | null>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    try { setResumen(await recaudoApi.periodo(token, periodo)); setError(''); }
    catch (e) { setError(errorMsg(e, 'No se pudo cargar el periodo')); }
  }, [token, periodo]);
  useEffect(() => { void recargar(); }, [recargar]);

  const puede = (p: string) => permisos.includes(p);
  const ctx: Ctx = {
    token, notify, periodo, resumen, recargar, empresaId, setEmpresaId, puede,
    cerrado: resumen?.cierre?.estado === 'CERRADO',
    ir: (t, id) => { if (id) setEmpresaId(id); setTab(t); window.scrollTo(0, 0); }
  };
  const visibles = TABS.filter(([, , p]) => puede(p));

  return (
    <div className="rec">
      <header className="rec-head">
        <div>
          <span className="section-kicker">Recaudo de libranzas</span>
          <h1>Pagos y facturación</h1>
        </div>
        <label className="rec-field rec-periodo" htmlFor="rec-periodo">
          <span>Periodo de nómina</span>
          <select id="rec-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {periodos().map((p) => <option key={p} value={p}>{nombrePeriodo(p)}</option>)}
          </select>
        </label>
      </header>
      <nav className="rec-tabs" aria-label="Secciones de Pagos y facturación">
        {visibles.map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? 'active' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{label}</button>
        ))}
      </nav>
      {error && <p className="rec-callout bad" role="alert">{error}</p>}
      {ctx.cerrado && tab !== 'cierre' && (
        <p className="rec-callout good">{nombrePeriodo(periodo)} está cerrado. Para cambiar pagos o cuentas de cobro, reábrelo en Cierre del mes.</p>
      )}
      {tab === 'resumen' && <ResumenTab ctx={ctx} />}
      {tab === 'cobro' && <CobroTab ctx={ctx} />}
      {tab === 'carga' && <CargaTab ctx={ctx} />}
      {tab === 'formatos' && <FormatosTab ctx={ctx} />}
      {tab === 'cierre' && <CierreTab ctx={ctx} />}
    </div>
  );
};

/* ---------- Resumen ---------- */
const ResumenTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const r = ctx.resumen;
  if (!r) return <p className="muted-note">Cargando el periodo…</p>;
  const total = r.empresas.reduce((s, e) => s + e.cobrado, 0);
  const rec = r.empresas.reduce((s, e) => s + e.recibido, 0);
  const pct = total ? Math.round((rec / total) * 100) : 0;
  const pendientes = r.empresas.filter((e) => ['SIN_GENERAR', 'GENERADA', 'ENVIADA'].includes(e.estado));
  const proximo = pendientes.map((e) => e.fechaLimiteGiro).sort()[0];
  return (
    <>
      <div className="rec-kpis">
        <div className="rec-kpi"><span>Total por cobrar</span><strong>{money(total)}</strong><small>{r.empresas.reduce((s, e) => s + e.creditos, 0)} créditos en {r.empresas.length} empresas</small></div>
        <div className="rec-kpi"><span>Recaudado y aplicado</span><strong>{money(rec)}</strong><div className="rec-bar" role="img" aria-label={`${pct} % recaudado`}><i style={{ width: `${pct}%` }} /></div><small>{pct} % del cobro</small></div>
        <div className="rec-kpi"><span>Por recaudar</span><strong>{money(total - rec)}</strong><small>incluye diferencias por reclamar</small></div>
        <div className="rec-kpi"><span>Empresas sin conciliar</span><strong>{pendientes.length}</strong><small>{proximo ? `próximo límite de giro ${fecha(proximo)}` : 'todo conciliado'}</small></div>
      </div>
      <section className="rec-panel flush">
        <div className="rec-panel-head"><h2>Empresas de {r.nombre}</h2><span className="rec-hint">La fecha límite es 3 días hábiles después del pago de la nómina (Ley 1527, art. 6).</span></div>
        {!r.empresas.length ? (
          <div className="rec-empty"><Receipt size={28} aria-hidden="true" /><p>No hay cuotas por cobrar en {r.nombre}. Las cuotas aparecen aquí cuando se desembolsan créditos de libranza con empresa asignada.</p></div>
        ) : (
          <div className="rec-tscroll">
            <table className="rec-table">
              <thead><tr><th>Empresa</th><th className="num">Créditos</th><th className="num">Cobrado</th><th className="num">Recibido</th><th className="num">Diferencia</th><th>Límite de giro</th><th>Estado</th><th /></tr></thead>
              <tbody>
                {r.empresas.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.nombre}</strong><small>{e.cuenta ? e.cuenta.consecutivo : 'Sin cuenta de cobro'}{e.nit ? ` · NIT ${e.nit}` : ''}</small></td>
                    <td className="num">{e.creditos}</td>
                    <td className="num">{money(e.cobrado)}</td>
                    <td className="num">{money(e.recibido)}</td>
                    <td className="num">{money(e.cobrado - e.recibido)}</td>
                    <td>{fecha(e.fechaLimiteGiro)}<small>nómina {fecha(e.fechaPagoNomina)}</small></td>
                    <td><Pill tone={ESTADO[e.estado][1]}>{ESTADO[e.estado][0]}</Pill></td>
                    <td><div className="rec-row-actions">
                      <button type="button" className="rec-btn link" onClick={() => ctx.ir('cobro', e.id)}>Cuenta de cobro</button>
                      {ctx.puede('recaudo:aplicar') && <button type="button" className="rec-btn link" onClick={() => ctx.ir('carga', e.id)}>Cargar pago</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};

/* ---------- Cuentas de cobro ---------- */
const CobroTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const empresas = ctx.resumen?.empresas ?? [];
  const sel = empresas.find((e) => e.id === ctx.empresaId) ?? empresas[0] ?? null;
  const [cuenta, setCuenta] = useState<CuentaCobroDetalle | null>(null);
  const [preview, setPreview] = useState<{ fechaPagoNomina: string; fechaLimiteGiro: string; detalle: DetalleCobro[]; total: number } | null>(null);
  const [cuentas, setCuentas] = useState<CuentaEgresoRow[]>([]);
  const [fechaPago, setFechaPago] = useState('');
  const [idCuentaEgreso, setIdCuentaEgreso] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);
  const [anulando, setAnulando] = useState(false);

  useEffect(() => { api.listCuentasEgreso(ctx.token, true).then(setCuentas).catch(() => setCuentas([])); }, [ctx.token]);
  useEffect(() => {
    setCuenta(null); setPreview(null); setAnulando(false);
    if (!sel) return;
    if (sel.cuenta) recaudoApi.cuenta(ctx.token, sel.cuenta.id).then(setCuenta).catch((e) => ctx.notify(errorMsg(e, 'No se pudo cargar la cuenta de cobro'), 'error'));
    else recaudoApi.vistaPrevia(ctx.token, sel.id, ctx.periodo).then((p) => { setPreview(p); setFechaPago(p.fechaPagoNomina); }).catch((e) => ctx.notify(errorMsg(e, 'No se pudo calcular la vista previa'), 'error'));
  }, [sel?.id, sel?.cuenta?.id, ctx.periodo, ctx.token]);

  if (!empresas.length) return <div className="rec-panel"><p className="muted-note">No hay empresas con cuotas por cobrar en este periodo.</p></div>;

  const accion = async (fn: () => Promise<CuentaCobroDetalle>, ok: string) => {
    setBusy(true);
    try { const c = await fn(); setCuenta(c); ctx.notify(ok, 'success'); await ctx.recargar(); }
    catch (e) { ctx.notify(errorMsg(e, 'No se pudo completar la acción'), 'error'); }
    finally { setBusy(false); }
  };
  const verPdf = async () => {
    if (!cuenta) return;
    try { openDocument(await recaudoApi.pdf(ctx.token, cuenta.id), `${cuenta.consecutivo}.pdf`); }
    catch (e) { ctx.notify(errorMsg(e, 'No se pudo generar el PDF'), 'error'); }
  };
  const bajarExcel = async () => {
    if (!cuenta) return;
    try { descargar(await recaudoApi.excel(ctx.token, cuenta.id), `${cuenta.consecutivo}.csv`); }
    catch (e) { ctx.notify(errorMsg(e, 'No se pudo descargar el Excel'), 'error'); }
  };
  const editable = ctx.puede('recaudo:cobro') && !ctx.cerrado;

  return (
    <>
      <section className="rec-panel">
        <div className="rec-actions">
          <EmpresaSelect id="cobro-empresa" value={sel?.id ?? null} onChange={(id) => ctx.setEmpresaId(id)} empresas={empresas.map((e) => ({ id: e.id, nombre: e.nombre, extra: e.cuenta?.consecutivo }))} />
          <span className="rec-spacer" />
          {cuenta && <Pill tone={ESTADO[cuenta.estado][1]}>{ESTADO[cuenta.estado][0]}</Pill>}
          {cuenta && <button type="button" className="rec-btn" onClick={verPdf}><FileText size={15} aria-hidden="true" /> Ver PDF</button>}
          {cuenta && <button type="button" className="rec-btn" onClick={bajarExcel}><FileDown size={15} aria-hidden="true" /> Excel</button>}
          {cuenta && editable && cuenta.estado !== 'ANULADA' && (
            <>
              <button type="button" className="rec-btn primary" disabled={busy} onClick={() => accion(() => recaudoApi.enviar(ctx.token, cuenta.id), `${cuenta.consecutivo} enviada a ${cuenta.empresa.correo}`)}>
                <Mail size={15} aria-hidden="true" /> {cuenta.envios ? 'Reenviar por correo' : 'Enviar por correo'}
              </button>
              {!cuenta.envios && <button type="button" className="rec-btn link" disabled={busy} onClick={() => accion(() => recaudoApi.enviar(ctx.token, cuenta.id, true), 'Marcada como enviada')}>Marcar como enviada</button>}
            </>
          )}
        </div>
        {cuenta && (
          <p className="rec-hint">
            {cuenta.envios
              ? `Enviada ${cuenta.envios} ${cuenta.envios === 1 ? 'vez' : 'veces'}; la última el ${fecha(cuenta.fechaUltimoEnvio)} a ${cuenta.correoUltimoEnvio}.`
              : `Aún no se ha enviado. Se enviará a ${cuenta.empresa.correo ?? '(la empresa no tiene correo: agrégalo en Empresas)'} con el PDF y el Excel adjuntos.`}
          </p>
        )}
      </section>

      {cuenta ? (
        <section className="rec-panel">
          <div className="rec-doc-head">
            <div><span className="section-kicker">Cuenta de cobro</span><h2>{cuenta.consecutivo}</h2><small>{cuenta.empresa.nombre}{cuenta.empresa.nit ? ` · NIT ${cuenta.empresa.nit}` : ''}</small></div>
            <dl className="rec-dl">
              <div><dt>Periodo</dt><dd>{cuenta.periodoNombre}</dd></div>
              <div><dt>Pago de nómina</dt><dd>{fecha(cuenta.fechaPagoNomina)}</dd></div>
              <div><dt>Límite de giro</dt><dd><strong>{fecha(cuenta.fechaLimiteGiro)}</strong></dd></div>
              <div><dt>Girar a</dt><dd>{cuenta.cuentaGiro ? `${cuenta.cuentaGiro.banco} · ${cuenta.cuentaGiro.tipo} ${cuenta.cuentaGiro.numero}` : 'Sin cuenta asignada'}</dd></div>
              <div><dt>Total</dt><dd><strong>{money(cuenta.total)}</strong></dd></div>
              <div><dt>Recibido</dt><dd>{money(cuenta.recibido)}</dd></div>
            </dl>
          </div>
          <TablaDetalle detalle={cuenta.detalle} total={cuenta.total} />
          {editable && ['GENERADA', 'ENVIADA'].includes(cuenta.estado) && (
            anulando
              ? <MotivoBox id="anular-motivo" label="Motivo de la anulación" boton={`Anular ${cuenta.consecutivo}`} onCancel={() => setAnulando(false)}
                  onConfirm={async (m) => { await accion(() => recaudoApi.anular(ctx.token, cuenta.id, m), `${cuenta.consecutivo} anulada`); setAnulando(false); }} />
              : <div className="rec-actions"><span className="rec-spacer rec-hint">Anula y vuelve a generar si cambiaron las cuotas o la cuenta de giro.</span><button type="button" className="rec-btn link danger" onClick={() => setAnulando(true)}>Anular cuenta de cobro</button></div>
          )}
        </section>
      ) : preview && sel ? (
        <section className="rec-panel">
          <div className="rec-doc-head">
            <div><span className="section-kicker">Vista previa · aún no generada</span><h2>{sel.nombre}</h2><small>{preview.detalle.length} créditos por {money(preview.total)}</small></div>
          </div>
          {preview.detalle.length ? <TablaDetalle detalle={preview.detalle} total={preview.total} /> : <p className="muted-note">La empresa no tiene cuotas por cobrar en este periodo.</p>}
          {editable && preview.detalle.length > 0 && (
            <div className="rec-form-grid">
              <label className="rec-field" htmlFor="cobro-fecha-pago"><span>Fecha de pago de la nómina</span><input id="cobro-fecha-pago" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} /></label>
              <label className="rec-field" htmlFor="cobro-cuenta"><span>Cuenta para el giro</span>
                <select id="cobro-cuenta" value={idCuentaEgreso} onChange={(e) => setIdCuentaEgreso(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">{cuentas.length ? 'La primera cuenta activa' : 'Sin cuentas registradas'}</option>
                  {cuentas.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}</option>)}
                </select>
              </label>
              <div className="rec-field"><span>&nbsp;</span>
                <button type="button" className="rec-btn primary" disabled={busy} onClick={() => accion(
                  () => recaudoApi.generarCuenta(ctx.token, { empresaId: sel.id, periodo: ctx.periodo, fechaPagoNomina: fechaPago || null, idCuentaEgreso: idCuentaEgreso || null }),
                  'Cuenta de cobro generada'
                )}><Send size={15} aria-hidden="true" /> Generar cuenta de cobro</button>
              </div>
            </div>
          )}
          <p className="rec-hint">Al generarla, el detalle queda congelado: el archivo de la empresa se concilia contra esta foto, no contra cambios posteriores.</p>
        </section>
      ) : <p className="muted-note">Cargando…</p>}
    </>
  );
};
