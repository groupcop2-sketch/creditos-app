import React, { useEffect, useState } from 'react';
import { ArrowRight, Banknote, CheckCircle2, Landmark, ReceiptText, Wallet } from 'lucide-react';
import { api, type CreditoDesembolsoRow, type CreditoLiquidacionDefinitivaRow, type CreditoRow, type CuentaEgresoRow, type FondeoDisponibleRow } from '../../api';

export type DesembolsoForm = {
  valorDesembolso: string;
  fechaDesembolso: string;
  fechaPrimeraCuota: string;
  idInversion: string;
  bancoDestino: string;
  tipoCuenta: string;
  numeroCuenta: string;
  referenciaPago: string;
  observacion: string;
  idCuentaEgreso: string;
  fechaConsignacion: string;
};

type Props = {
  token: string;
  credito: CreditoRow;
  liquidacion: CreditoLiquidacionDefinitivaRow | null;
  desembolsos: CreditoDesembolsoRow[];
  form: DesembolsoForm;
  onChange: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: () => Promise<void>;
  fondeoDisponible: FondeoDisponibleRow[];
  readOnly: boolean;
  loading: boolean;
  formatMoney: (val?: number | null) => string;
};

const fecha = (iso?: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Disbursement (egreso): value to pay, company account it leaves from, client account it goes to, auto CE consecutive. */
export const DesembolsoPanel: React.FC<Props> = ({ token, credito, liquidacion, desembolsos, form, onChange, onSubmit, fondeoDisponible, readOnly, loading, formatMoney }) => {
  const [cuentas, setCuentas] = useState<CuentaEgresoRow[]>([]);
  const [siguiente, setSiguiente] = useState('');
  const set = (patch: Partial<DesembolsoForm>) => onChange((c: DesembolsoForm) => ({ ...c, ...patch }));

  useEffect(() => {
    if (readOnly) return;
    api.listCuentasEgreso(token, true).then((rows) => {
      setCuentas(rows);
      if (rows.length === 1 && !form.idCuentaEgreso) set({ idCuentaEgreso: String(rows[0].id) });
    }).catch(() => setCuentas([]));
    api.siguienteNumeroEgreso(token).then((r) => setSiguiente(r.numeroEgreso)).catch(() => setSiguiente(''));
  }, [token, readOnly, desembolsos.length]);

  const vigentes = desembolsos.filter((d) => d.estadoDesembolso !== 'ANULADO');
  const descuentos = (liquidacion?.conceptos ?? []).filter((c) => c.clase === 'DESCUENTO_DESEMBOLSO' && Number(c.valorCalculado) > 0);
  const faltan = [
    !liquidacion && 'liquidación definitiva',
    !form.idCuentaEgreso && 'medio de pago',
    !form.bancoDestino.trim() && 'banco destino',
    !form.tipoCuenta.trim() && 'tipo de cuenta',
    !form.numeroCuenta.trim() && 'número de cuenta',
    !form.fechaDesembolso && 'fecha de egreso'
  ].filter(Boolean) as string[];

  return (
    <section className="desembolso-panel" aria-labelledby="desembolso-title">
      <header className="desembolso-hero">
        <div>
          <span className="desembolso-eyebrow"><Banknote size={16} aria-hidden="true" /> Valor a desembolsar</span>
          <strong id="desembolso-title" className="desembolso-amount">{liquidacion ? formatMoney(liquidacion.valorDesembolso) : '—'}</strong>
          {liquidacion && (
            <span className="desembolso-math">
              Crédito {formatMoney(liquidacion.valorCredito)} − descuentos {formatMoney(liquidacion.descuentosDesembolso)}
            </span>
          )}
        </div>
        <div className="desembolso-ce">
          <span>Comprobante de egreso</span>
          <strong>{vigentes[0]?.numeroEgreso ?? (siguiente || 'CE-—')}</strong>
          <small>{vigentes[0] ? `Registrado el ${fecha(vigentes[0].fechaDesembolso)}` : 'Se asigna al confirmar'}</small>
        </div>
      </header>

      <dl className="desembolso-info">
        <div><dt>Crédito</dt><dd>{credito.consecutivo}</dd></div>
        <div><dt>Línea</dt><dd>{credito.producto}</dd></div>
        <div><dt>Tasa mensual</dt><dd>{liquidacion ? `${liquidacion.tasaMensual}%` : credito.tasa != null ? `${credito.tasa}%` : '—'}</dd></div>
        <div><dt>Plazo</dt><dd>{liquidacion?.plazo ?? credito.plazo} meses</dd></div>
        <div><dt>Primera cuota</dt><dd>{fecha(form.fechaPrimeraCuota)}</dd></div>
        <div><dt>Valor crédito</dt><dd>{formatMoney(liquidacion?.valorCredito ?? credito.montoSolicitado)}</dd></div>
        <div><dt>Valor cuota</dt><dd>{formatMoney(liquidacion?.cuota ?? credito.cuotaEstimada)}</dd></div>
      </dl>

      {descuentos.length > 0 && (
        <div className="desembolso-descuentos">
          <h4>Conceptos descontados del desembolso</h4>
          <ul>
            {descuentos.map((c, i) => <li key={i}><span>{String(c.nombre)}</span><span className="num">− {formatMoney(Number(c.valorCalculado))}</span></li>)}
          </ul>
        </div>
      )}

      {vigentes.length > 0 && (
        <div className="desembolso-registrado" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          {vigentes.map((d) => (
            <p key={d.id}>
              <strong>{d.numeroEgreso ?? d.numeroOrden}</strong> · {formatMoney(d.valorDesembolso)} · {fecha(d.fechaDesembolso)}
              <br /><small>{d.medioPago ?? 'Medio de pago no registrado'} <ArrowRight size={12} aria-hidden="true" /> {d.bancoDestino} {d.tipoCuenta} {d.numeroCuenta}{d.usuario ? ` · ${d.usuario}` : ''}</small>
            </p>
          ))}
        </div>
      )}

      {!readOnly && vigentes.length === 0 && (
        <form className="desembolso-form" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
          <fieldset>
            <legend><Landmark size={15} aria-hidden="true" /> Origen del pago</legend>
            <label className="span-2">
              <span>Medio de pago *</span>
              <select required value={form.idCuentaEgreso} onChange={(e) => set({ idCuentaEgreso: e.target.value })}>
                <option value="">{cuentas.length ? 'Selecciona la cuenta de la empresa…' : 'No hay cuentas: regístralas en Entidades bancarias'}</option>
                {cuentas.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}</option>)}
              </select>
            </label>
            <label className="span-2">
              <span>Fondeo (socio / inversión)</span>
              <select value={form.idInversion} onChange={(e) => set({ idInversion: e.target.value })}>
                <option value="">Sin fondeo de inversionista</option>
                {fondeoDisponible.map((f) => <option key={f.idInversion} value={f.idInversion}>{f.inversionista} · disponible {formatMoney(f.saldoDisponible)}</option>)}
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend><Wallet size={15} aria-hidden="true" /> Cuenta del cliente</legend>
            <label><span>Banco *</span><input required value={form.bancoDestino} onChange={(e) => set({ bancoDestino: e.target.value })} /></label>
            <label>
              <span>Tipo *</span>
              <select required value={form.tipoCuenta} onChange={(e) => set({ tipoCuenta: e.target.value })}>
                <option value="">Selecciona…</option>
                {['AHORROS', 'CORRIENTE'].concat(form.tipoCuenta && !['AHORROS', 'CORRIENTE'].includes(form.tipoCuenta) ? [form.tipoCuenta] : []).map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </label>
            <label className="span-2"><span>Número de cuenta *</span><input required inputMode="numeric" value={form.numeroCuenta} onChange={(e) => set({ numeroCuenta: e.target.value })} /></label>
          </fieldset>

          <fieldset>
            <legend><ReceiptText size={15} aria-hidden="true" /> Egreso</legend>
            <label><span>Fecha de egreso *</span><input type="date" required value={form.fechaDesembolso} onChange={(e) => set({ fechaDesembolso: e.target.value })} /></label>
            <label><span>Fecha de consignación</span><input type="date" value={form.fechaConsignacion || form.fechaDesembolso} onChange={(e) => set({ fechaConsignacion: e.target.value })} /></label>
            <label><span>Primera cuota</span><input type="date" value={form.fechaPrimeraCuota} onChange={(e) => set({ fechaPrimeraCuota: e.target.value })} /></label>
            <label><span>Referencia de la transferencia</span><input placeholder="Opcional" value={form.referenciaPago} onChange={(e) => set({ referenciaPago: e.target.value })} /></label>
            <label className="span-4"><span>Observación</span><input maxLength={500} value={form.observacion} onChange={(e) => set({ observacion: e.target.value })} /></label>
          </fieldset>

          <footer className="desembolso-footer">
            <p>{faltan.length ? `Falta: ${faltan.join(', ')}.` : `Se registrará el egreso ${siguiente || ''} por ${liquidacion ? formatMoney(liquidacion.valorDesembolso) : ''}.`}</p>
            <button type="submit" className="stage-btn-primary" disabled={loading || faltan.length > 0}>
              <CheckCircle2 size={15} aria-hidden="true" /> {loading ? 'Registrando…' : 'Confirmar egreso'}
            </button>
          </footer>
        </form>
      )}
    </section>
  );
};
