import React, { useCallback, useEffect, useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { ESTADO, fecha, money, nombrePeriodo, recaudoApi, type EstadoCierre } from './recaudo.api';
import { errorMsg, MotivoBox, Pill, type Ctx } from './recaudo.shared';

type Estado = 'ok' | 'pend' | 'aviso';
const ESTADO_CHECK: Record<Estado, [string, string]> = { ok: ['Listo', 'good'], pend: ['Pendiente', 'bad'], aviso: ['Aviso', 'warn'] };

const Check: React.FC<{ estado: Estado; titulo: string; children: React.ReactNode; acciones?: React.ReactNode }> = ({ estado, titulo, children, acciones }) => (
  <li className="rec-check">
    <Pill tone={ESTADO_CHECK[estado][1]}>{ESTADO_CHECK[estado][0]}</Pill>
    <div><h3>{titulo}</h3><div className="rec-check-text">{children}</div>{acciones && <div className="rec-actions">{acciones}</div>}</div>
  </li>
);

export const CierreTab: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const [e, setE] = useState<EstadoCierre | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [reabriendo, setReabriendo] = useState(false);
  const [asignando, setAsignando] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    try { setE(await recaudoApi.cierre(ctx.token, ctx.periodo)); }
    catch (err) { ctx.notify(errorMsg(err, 'No se pudo cargar el cierre'), 'error'); }
  }, [ctx.token, ctx.periodo]);
  useEffect(() => { void cargar(); }, [cargar]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); ctx.notify(ok, 'success'); await Promise.all([cargar(), ctx.recargar()]); }
    catch (err) { ctx.notify(errorMsg(err, 'No se pudo completar la acción'), 'error'); }
    finally { setBusy(false); }
  };

  if (!e) return <p className="muted-note">Cargando el cierre…</p>;
  const t = e.totales;
  const tiles = (
    <div className="rec-tiles">
      <div><span>Recaudado y aplicado</span><strong>{money(t.recaudado)}</strong></div>
      <div><span>Cuotas pagadas</span><strong>{t.cuotasPagadas}</strong></div>
      <div><span>Pasa a {nombrePeriodo(e.siguiente).toLowerCase()} ({t.cuotasConSaldo} cuotas)</span><strong>{money(t.arrastre)}</strong></div>
      <div><span>Diferencias a reclamar</span><strong>{money(t.reclamar)}</strong></div>
      <div><span>Saldo a favor</span><strong>{money(t.saldoFavor)}</strong></div>
      <div><span>Saldo por identificar</span><strong>{money(t.porIdentificar)}</strong></div>
    </div>
  );
  const tabla = (
    <section className="rec-panel flush">
      <div className="rec-tscroll">
        <table className="rec-table">
          <thead><tr><th>Empresa</th><th>Estado</th><th className="num">Cuotas pagadas</th><th className="num">Cuotas con saldo</th><th className="num">Pasa al mes siguiente</th><th className="num">A reclamar</th><th className="num">Saldo a favor</th></tr></thead>
          <tbody>
            {!e.cuentas.length && <tr><td colSpan={7} className="muted-note">No hay cuentas de cobro en este periodo.</td></tr>}
            {e.cuentas.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.empresa}</strong><small>{c.consecutivo}</small></td>
                <td><Pill tone={ESTADO[c.estado][1]}>{ESTADO[c.estado][0]}</Pill></td>
                {c.resumen ? <>
                  <td className="num">{c.resumen.pagadas}</td><td className="num">{c.resumen.conSaldo}</td><td className="num">{money(c.resumen.arrastre)}</td>
                  <td className="num">{money(c.resumen.reclamar)}</td><td className="num">{money(c.resumen.favor)}</td>
                </> : <td colSpan={5} className="muted-note">Sin archivo aplicado</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  if (e.cierre?.estado === 'CERRADO') {
    return (
      <>
        <div className="rec-callout good rec-closed">
          <Lock size={20} aria-hidden="true" />
          <div><strong>{e.nombre} está cerrado desde el {fecha(e.cierre.fecha)}.</strong>
            <p>Se recalculó la mora, se guardó la foto de la cartera y las cuentas de cobro de {nombrePeriodo(e.siguiente).toLowerCase()} quedaron generadas para revisar y enviar.</p></div>
        </div>
        {e.borradores && (
          <section className="rec-panel">
            <h2>Cuentas de cobro de {nombrePeriodo(e.siguiente).toLowerCase()}</h2>
            <ul className="rec-list">{e.borradores.map((b) => <li key={b.empresa}><strong>{b.empresa}</strong>: {b.consecutivo ?? b.error}</li>)}</ul>
          </section>
        )}
        {tiles}
        {tabla}
        {ctx.puede('recaudo:cierre') && (
          reabriendo
            ? <MotivoBox id="reabrir-motivo" label="Motivo de la reapertura" boton={`Reabrir ${e.nombre.toLowerCase()}`} placeholder="Ej. la empresa giró tarde y debe quedar en este mes"
                onCancel={() => setReabriendo(false)} onConfirm={async (m) => { await run(() => recaudoApi.reabrir(ctx.token, ctx.periodo, m), `${e.nombre} reabierto`); setReabriendo(false); }} />
            : <div className="rec-actions"><span className="rec-spacer rec-hint">Reabrir anula las cuentas del mes siguiente que no se hayan enviado y borra la foto de cartera.</span>
                <button type="button" className="rec-btn danger" onClick={() => setReabriendo(true)}><LockOpen size={15} aria-hidden="true" /> Reabrir periodo</button></div>
        )}
      </>
    );
  }

  const ch = e.chequeos;
  const conCuentaPendiente = [...ch.sinEnviar, ...ch.sinPago];
  return (
    <>
      {e.cierre?.estado === 'REABIERTO' && <p className="rec-callout warn">Este periodo fue reabierto: {e.cierre.motivoReapertura}</p>}
      <section className="rec-panel flush">
        <div className="rec-panel-head"><h2>Antes de cerrar {e.nombre.toLowerCase()}</h2><span className="rec-hint">{e.listo ? 'Todo listo para cerrar' : 'Resuelve los pendientes para habilitar el cierre'}</span></div>
        <ul className="rec-checks">
          <Check estado={ch.sinCuenta.length || ch.sinEnviar.length ? 'pend' : 'ok'} titulo="Cuentas de cobro generadas y enviadas"
            acciones={[...ch.sinCuenta.map((x) => ({ id: x.id, nombre: x.nombre })), ...ch.sinEnviar.map((x) => ({ id: x.empresaId, nombre: x.nombre }))].map((x) => (
              <button key={x.id} type="button" className="rec-btn" onClick={() => ctx.ir('cobro', x.id)}>Ir a {x.nombre}</button>
            ))}>
            {ch.sinCuenta.length || ch.sinEnviar.length
              ? <>{ch.sinCuenta.length > 0 && <p>Sin generar: {ch.sinCuenta.map((x) => x.nombre).join(', ')}.</p>}{ch.sinEnviar.length > 0 && <p>Generadas sin enviar: {ch.sinEnviar.map((x) => `${x.nombre} (${x.consecutivo})`).join(', ')}.</p>}</>
              : <p>Todas las empresas con cobro recibieron su cuenta de cobro.</p>}
          </Check>
          <Check estado={ch.sinPago.length ? 'pend' : 'ok'} titulo="Pago cargado o marcado en cada empresa"
            acciones={ch.sinPago.map((x) => (
              <React.Fragment key={x.id}>
                {ctx.puede('recaudo:aplicar') && <button type="button" className="rec-btn" onClick={() => ctx.ir('carga', x.empresaId)}>Cargar {x.nombre}</button>}
                {ctx.puede('recaudo:aplicar') && <button type="button" className="rec-btn link danger" disabled={busy} onClick={() => run(() => recaudoApi.noGiro(ctx.token, x.id), `${x.nombre} quedó como «no giró»`)}>Marcar «no giró»</button>}
              </React.Fragment>
            ))}>
            <p>{ch.sinPago.length
              ? `Sin archivo aplicado: ${ch.sinPago.map((x) => x.nombre).join(', ')}. Carga su archivo o márcala como «no giró» para reclamarle el total (Ley 1527, art. 6).`
              : 'Todas las empresas tienen su archivo aplicado o están marcadas como «no giró».'}</p>
          </Check>
          <Check estado={ch.revision.length ? 'pend' : 'ok'} titulo="Pagos sin identificar resueltos">
            {!ch.revision.length ? <p>No hay pagos en revisión.</p> : (
              <ul className="rec-list">
                {ch.revision.map((r) => (
                  <li key={r.id}>
                    <span><strong>{money(r.valor)}</strong> · cédula {r.identificacion}{r.nombre ? ` (${r.nombre})` : ''} · {r.empresa}, {r.lote}. {r.detalle}</span>
                    {ctx.puede('recaudo:aplicar') && (
                      <span className="rec-actions">
                        <input aria-label="Número interno del crédito" placeholder="ID del crédito" inputMode="numeric" style={{ width: 120 }} value={asignando[r.id] ?? ''} onChange={(ev) => setAsignando({ ...asignando, [r.id]: ev.target.value.replace(/\D/g, '') })} />
                        <button type="button" className="rec-btn" disabled={busy || !asignando[r.id]} onClick={() => run(() => recaudoApi.asignar(ctx.token, r.id, Number(asignando[r.id])), 'Pago asignado al crédito')}>Asignar</button>
                        <button type="button" className="rec-btn link" disabled={busy} onClick={() => run(() => recaudoApi.porIdentificar(ctx.token, r.id), 'Quedó como saldo por identificar')}>Dejar como saldo por identificar</button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Check>
          <Check estado={ch.novedadesPendientes ? 'pend' : 'ok'} titulo="Novedades revisadas"
            acciones={ch.novedadesPendientes > 0 && ctx.puede('recaudo:aplicar') ? <button type="button" className="rec-btn" disabled={busy} onClick={() => run(() => recaudoApi.novedadesRevisadas(ctx.token, ctx.periodo), 'Novedades marcadas como revisadas')}>Marcar como revisadas</button> : undefined}>
            <p>{ch.novedadesTotal
              ? `${ch.novedadesTotal} cuotas no se descontaron por novedad (retiro, incapacidad, licencia). ${ch.novedadesPendientes ? 'Confirma que cada una tiene su gestión.' : 'Revisadas.'}`
              : 'No hubo novedades este mes.'}</p>
          </Check>
          <Check estado={ch.sinVencer.length ? 'aviso' : 'ok'} titulo="Plazo de giro vencido">
            <p>{ch.sinVencer.length
              ? `Aún no vence el plazo de ${ch.sinVencer.map((x) => `${x.nombre} (${fecha(x.fechaLimiteGiro)})`).join(', ')}. Lo que giren después del cierre entra como pago tardío del mes siguiente. No bloquea el cierre.`
              : 'Venció el plazo de giro de todas las empresas.'}</p>
          </Check>
        </ul>
      </section>
      <section className="rec-panel">
        <h2>Qué hará el cierre</h2>
        {tiles}
        <ol className="rec-steps">
          <li>Recalcula la mora de las cuotas vencidas sin pagar.</li>
          <li>Guarda la foto de la cartera por crédito: saldo, cuotas vencidas, días y rango de mora.</li>
          <li>Congela el periodo: no se generan, aplican ni reversan pagos sin reabrirlo.</li>
          <li>Genera las cuentas de cobro de {nombrePeriodo(e.siguiente).toLowerCase()}, que incluyen lo que quedó pendiente con su mora.</li>
        </ol>
      </section>
      {tabla}
      {ctx.puede('recaudo:cierre') && (
        confirmando
          ? <div className="rec-confirm">
              <strong>¿Cerrar {e.nombre.toLowerCase()}?</strong>
              <span>Se congelan {money(t.recaudado)} aplicados y pasan {money(t.arrastre)} al mes siguiente. Solo se puede deshacer reabriendo el periodo.</span>
              <div className="rec-actions">
                <button type="button" className="rec-btn primary" disabled={busy} onClick={async () => {
                  setBusy(true);
                  try { const r = await recaudoApi.cerrar(ctx.token, ctx.periodo); setE(r); setConfirmando(false); ctx.notify(`${e.nombre} cerrado`, 'success'); await ctx.recargar(); }
                  catch (err) { ctx.notify(errorMsg(err, 'No se pudo cerrar el periodo'), 'error'); }
                  finally { setBusy(false); }
                }}>{busy ? 'Cerrando…' : `Cerrar ${e.nombre.toLowerCase()}`}</button>
                <button type="button" className="rec-btn link" onClick={() => setConfirmando(false)}>Cancelar</button>
              </div>
            </div>
          : <div className="rec-actions"><span className="rec-spacer rec-hint">{e.listo ? '' : 'Completa los pendientes de la lista para habilitar el cierre.'}</span>
              <button type="button" className="rec-btn primary" disabled={!e.listo || conCuentaPendiente.length > 0 || !e.cuentas.length} onClick={() => setConfirmando(true)}><Lock size={15} aria-hidden="true" /> Cerrar el mes</button></div>
      )}
    </>
  );
};
