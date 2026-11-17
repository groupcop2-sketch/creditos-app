import React from 'react';
import { money, type DetalleCobro, type ResumenPeriodo } from './recaudo.api';

export type Tab = 'resumen' | 'cobro' | 'carga' | 'formatos' | 'cierre';
export type Notify = (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;

/** What every tab receives from the module shell. */
export type Ctx = {
  token: string;
  notify: Notify;
  periodo: string;
  resumen: ResumenPeriodo | null;
  recargar: () => Promise<void>;
  ir: (tab: Tab, empresaId?: number) => void;
  empresaId: number | null;
  setEmpresaId: (id: number | null) => void;
  puede: (permiso: string) => boolean;
  cerrado: boolean;
};

export const Pill: React.FC<{ tone: string; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`rec-pill rec-${tone}`}>{children}</span>
);

export const errorMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const EmpresaSelect: React.FC<{ id: string; value: number | null; onChange: (id: number) => void; empresas: Array<{ id: number; nombre: string; extra?: string }> }> = ({ id, value, onChange, empresas }) => (
  <label className="rec-field" htmlFor={id}>
    <span>Empresa</span>
    <select id={id} value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
      <option value="" disabled>Selecciona una empresa</option>
      {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}{e.extra ? ` (${e.extra})` : ''}</option>)}
    </select>
  </label>
);

export const TablaDetalle: React.FC<{ detalle: DetalleCobro[]; total: number }> = ({ detalle, total }) => (
  <div className="rec-tscroll">
    <table className="rec-table">
      <thead><tr><th className="num">Identificación</th><th>Empleado</th><th>Crédito</th><th className="num">Cuota</th><th className="num">Valor cuota</th><th className="num">Mora</th><th className="num">Total a descontar</th><th className="num">Saldo capital</th></tr></thead>
      <tbody>
        {detalle.map((d) => (
          <tr key={d.idCredito}>
            <td className="num">{d.identificacion}</td>
            <td>{d.nombre}</td>
            <td>{d.consecutivo}</td>
            <td className="num">{d.numeroCuota} de {d.totalCuotas}{d.cuotasPendientes > 1 && <small>{d.cuotasPendientes} cuotas pendientes</small>}</td>
            <td className="num">{money(d.valorCuota)}</td>
            <td className="num">{d.mora ? money(d.mora) : '—'}</td>
            <td className="num"><strong>{money(d.total)}</strong></td>
            <td className="num">{money(d.saldoCapital)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot><tr><td colSpan={6}>Total</td><td className="num">{money(total)}</td><td /></tr></tfoot>
    </table>
  </div>
);

/** Inline confirmation with a required reason (no window.confirm). */
export const MotivoBox: React.FC<{ id: string; label: string; boton: string; placeholder?: string; onConfirm: (motivo: string) => Promise<void> | void; onCancel: () => void }> = ({ id, label, boton, placeholder, onConfirm, onCancel }) => {
  const [motivo, setMotivo] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  return (
    <div className="rec-confirm">
      <label className="rec-field" htmlFor={id}><span>{label}</span><input id={id} autoFocus value={motivo} placeholder={placeholder} onChange={(e) => setMotivo(e.target.value)} /></label>
      <div className="rec-actions">
        <button type="button" className="rec-btn danger" disabled={busy || motivo.trim().length < 5} onClick={async () => { setBusy(true); try { await onConfirm(motivo.trim()); } finally { setBusy(false); } }}>{boton}</button>
        <button type="button" className="rec-btn link" onClick={onCancel}>Cancelar</button>
        <small className="rec-hint">Mínimo 5 caracteres; queda registrado.</small>
      </div>
    </div>
  );
};
