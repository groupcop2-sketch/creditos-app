import React, { useEffect, useState } from 'react';
import { Landmark, Pencil, Plus, X } from 'lucide-react';
import { api, type BancoItem, type CuentaEgresoInput, type CuentaEgresoRow } from '../../api';

type Props = {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
};

const EMPTY: CuentaEgresoInput = { banco: '', tipoCuenta: 'AHORROS', numeroCuenta: '', titular: '', activo: true };

/** Company bank accounts offered as "medio de pago" when registering a disbursement. */
export const CuentasEgresoPanel: React.FC<Props> = ({ token, notify }) => {
  const [cuentas, setCuentas] = useState<CuentaEgresoRow[]>([]);
  const [bancos, setBancos] = useState<BancoItem[]>([]);
  const [form, setForm] = useState<CuentaEgresoInput>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.listCuentasEgreso(token).then(setCuentas).catch((e) => notify(e instanceof Error ? e.message : 'No se pudieron cargar las cuentas', 'error'));
  useEffect(() => {
    load();
    api.listBancos(token).then(setBancos).catch(() => setBancos([]));
  }, [token]);

  const reset = () => { setForm(EMPTY); setEditId(null); };

  const guardar = async (body: CuentaEgresoInput, id?: number) => {
    setSaving(true);
    try {
      await api.guardarCuentaEgreso(token, body, id);
      notify(id ? 'Cuenta actualizada' : 'Cuenta registrada', 'success');
      reset();
      await load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'No se pudo guardar la cuenta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    guardar({ ...form, titular: form.titular?.trim() || null }, editId ?? undefined);
  };

  const editar = (c: CuentaEgresoRow) => {
    setEditId(c.id);
    setForm({ banco: c.banco, tipoCuenta: c.tipoCuenta, numeroCuenta: c.numeroCuenta, titular: c.titular ?? '', activo: c.activo });
  };

  return (
    <section className="cuentas-egreso" aria-labelledby="cuentas-egreso-title">
      <header>
        <h3 id="cuentas-egreso-title"><Landmark size={18} aria-hidden="true" /> Cuentas de la empresa (medio de pago)</h3>
        <p>Cuentas desde las que se giran los desembolsos. Solo las activas aparecen al registrar un egreso.</p>
      </header>

      <form className="cuentas-egreso-form" onSubmit={submit}>
        <label>
          <span>Banco</span>
          <select required value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })}>
            <option value="">Selecciona…</option>
            {bancos.map((b) => <option key={b.id} value={b.nombre}>{b.nombre}</option>)}
            {form.banco && !bancos.some((b) => b.nombre === form.banco) && <option value={form.banco}>{form.banco}</option>}
          </select>
        </label>
        <label>
          <span>Tipo</span>
          <select value={form.tipoCuenta} onChange={(e) => setForm({ ...form, tipoCuenta: e.target.value as CuentaEgresoInput['tipoCuenta'] })}>
            <option value="AHORROS">Ahorros</option>
            <option value="CORRIENTE">Corriente</option>
          </select>
        </label>
        <label>
          <span>Número de cuenta</span>
          <input required inputMode="numeric" pattern="[0-9 \-]{4,40}" value={form.numeroCuenta} onChange={(e) => setForm({ ...form, numeroCuenta: e.target.value })} />
        </label>
        <label>
          <span>Titular (opcional)</span>
          <input maxLength={200} value={form.titular ?? ''} onChange={(e) => setForm({ ...form, titular: e.target.value })} />
        </label>
        <div className="cuentas-egreso-actions">
          <button type="submit" className="stage-btn-primary" disabled={saving}>
            {editId ? <Pencil size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />} {editId ? 'Guardar cambios' : 'Agregar cuenta'}
          </button>
          {editId && <button type="button" className="doc-action-btn" onClick={reset}><X size={14} aria-hidden="true" /> Cancelar</button>}
        </div>
      </form>

      {cuentas.length === 0 ? (
        <p className="muted-note">Aún no hay cuentas registradas. Agrega al menos una para poder desembolsar.</p>
      ) : (
        <table className="cuentas-egreso-table">
          <thead><tr><th>Banco</th><th>Tipo</th><th>Número</th><th>Titular</th><th>Estado</th><th aria-label="Acciones" /></tr></thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id} className={c.activo ? '' : 'inactiva'}>
                <td>{c.banco}</td>
                <td>{c.tipoCuenta === 'AHORROS' ? 'Ahorros' : 'Corriente'}</td>
                <td className="num">{c.numeroCuenta}</td>
                <td>{c.titular || '—'}</td>
                <td>
                  <label className="cuentas-egreso-switch">
                    <input type="checkbox" checked={c.activo} disabled={saving} onChange={() => guardar({ banco: c.banco, tipoCuenta: c.tipoCuenta, numeroCuenta: c.numeroCuenta, titular: c.titular, activo: !c.activo }, c.id)} />
                    {c.activo ? 'Activa' : 'Inactiva'}
                  </label>
                </td>
                <td><button type="button" className="doc-action-btn" onClick={() => editar(c)}><Pencil size={14} aria-hidden="true" /> Editar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};
