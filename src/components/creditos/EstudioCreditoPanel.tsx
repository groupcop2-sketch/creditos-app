import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api, type CreditoRow, type EstudioCreditoRow, type TipoEstudio } from '../../api';
import { calcularEstudio, PORCENTAJE_APORTES_LEY, PORCENTAJE_ESTUDIO_DEFECTO, type VariablesEstudio } from './estudio-credito';

type Props = {
  token: string;
  credito: CreditoRow;
  readOnly?: boolean;
  formatMoney: (val?: number | null) => string;
  formatDateTime: (val?: string | null) => string;
  onEstudiosChange: (count: number) => void;
};

const toNumber = (text: string) => Number(text.replace(/[^\d]/g, '')) || 0;
const toText = (value: number) => (value ? value.toLocaleString('es-CO') : '');

export const EstudioCreditoPanel: React.FC<Props> = ({ token, credito, readOnly = false, formatMoney, formatDateTime, onEstudiosChange }) => {
  const [tipo, setTipo] = useState<TipoEstudio>(/libranza/i.test(credito.tipoCredito || '') ? 'LIBRANZA' : 'LIBRE_INVERSION');
  const [vars, setVars] = useState<VariablesEstudio>({});
  const [aportesManual, setAportesManual] = useState(false);
  const [porcentaje, setPorcentaje] = useState(PORCENTAJE_ESTUDIO_DEFECTO);
  const [observacion, setObservacion] = useState('');
  const [estudios, setEstudios] = useState<EstudioCreditoRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listEstudiosCredito(token, credito.id)
      .then((rows) => {
        setEstudios(rows);
        onEstudiosChange(rows.length);
        // Closed stage: show the last saved study exactly as it was approved.
        if (readOnly && rows[0]) {
          setTipo(rows[0].tipo);
          setVars(rows[0].variables);
          setAportesManual(true);
          setPorcentaje(rows[0].porcentaje);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los estudios'));
    // onEstudiosChange is a parent setter; reload only when the credit changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, credito.id, readOnly]);

  const variables = useMemo<VariablesEstudio>(() => {
    if (tipo !== 'LIBRANZA' || aportesManual) return vars;
    return { ...vars, aportesLey: Math.round(((vars.salario ?? 0) * PORCENTAJE_APORTES_LEY) / 100) };
  }, [tipo, vars, aportesManual]);

  const resultado = useMemo(() => calcularEstudio(tipo, variables, porcentaje), [tipo, variables, porcentaje]);
  const cuota = credito.cuotaEstimada;
  const viable = cuota == null ? resultado.cuotaMaxima > 0 : cuota <= resultado.cuotaMaxima;
  const hasData = tipo === 'LIBRANZA' ? (variables.salario ?? 0) > 0 : (variables.ingresosDemostrables ?? 0) > 0;

  const field = (key: keyof VariablesEstudio, label: string, hint?: string) => (
    <label className="estudio-field">
      <span>{label}</span>
      <div className="estudio-money">
        <i aria-hidden="true">$</i>
        <input
          inputMode="numeric"
          value={toText(variables[key] ?? 0)}
          onChange={(event) => {
            if (key === 'aportesLey') setAportesManual(true);
            setVars((current) => ({ ...current, [key]: toNumber(event.target.value) }));
          }}
          placeholder="0"
        />
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );

  const guardar = async () => {
    setSaving(true);
    setError('');
    try {
      const keys: Array<keyof VariablesEstudio> = tipo === 'LIBRANZA' ? ['salario', 'aportesLey', 'deduccionesNomina'] : ['ingresosDemostrables', 'obligacionesCentrales'];
      const payload = Object.fromEntries(keys.map((key) => [key, variables[key] ?? 0]));
      const rows = await api.registrarEstudioCredito(token, credito.id, { tipo, variables: payload, porcentaje, observacion: observacion.trim() || undefined });
      setEstudios(rows);
      onEstudiosChange(rows.length);
      setObservacion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el estudio');
    } finally {
      setSaving(false);
    }
  };

  const ultimo = estudios[0];

  return (
    <section className="estudio-panel" aria-labelledby="estudio-title">
      <header className="estudio-header">
        <div>
          <h3 id="estudio-title"><Calculator size={18} aria-hidden="true" /> Estudio de capacidad de pago</h3>
          <p>{readOnly ? 'Etapa cerrada: este es el último estudio guardado, solo consulta.' : 'Ingresa las variables del solicitante; la cuota máxima se recalcula al instante.'}</p>
        </div>
        <fieldset className="estudio-toggle" disabled={readOnly} aria-label="Tipo de estudio">
          <button type="button" className={tipo === 'LIBRANZA' ? 'active' : ''} aria-pressed={tipo === 'LIBRANZA'} onClick={() => setTipo('LIBRANZA')}>Libranza</button>
          <button type="button" className={tipo === 'LIBRE_INVERSION' ? 'active' : ''} aria-pressed={tipo === 'LIBRE_INVERSION'} onClick={() => setTipo('LIBRE_INVERSION')}>Libre inversión</button>
        </fieldset>
      </header>

      <div className="estudio-grid">
        <fieldset className="estudio-inputs" disabled={readOnly}>
          {tipo === 'LIBRANZA' ? (
            <>
              {field('salario', 'Salario')}
              {field('aportesLey', 'Aportes de ley', aportesManual ? 'Valor ingresado manualmente' : `Calculado: ${PORCENTAJE_APORTES_LEY}% del salario (salud 4% + pensión 4%). Puedes ajustarlo.`)}
              {field('deduccionesNomina', 'Deducciones de nómina', 'Descuentos vigentes en el desprendible')}
            </>
          ) : (
            <>
              {field('ingresosDemostrables', 'Ingresos demostrables')}
              {field('obligacionesCentrales', 'Obligaciones en centrales de riesgo', 'Cuotas mensuales reportadas')}
            </>
          )}
          <label className="estudio-field">
            <span>Porcentaje aplicado al disponible</span>
            <div className="estudio-pct">
              <input type="range" min={1} max={100} value={porcentaje} onChange={(event) => setPorcentaje(Number(event.target.value))} aria-label="Porcentaje" />
              <div className="estudio-money"><input inputMode="numeric" value={porcentaje} onChange={(event) => setPorcentaje(Math.min(100, Math.max(0, toNumber(event.target.value))))} aria-label="Porcentaje en número" /><i aria-hidden="true">%</i></div>
            </div>
            <small>Por defecto {PORCENTAJE_ESTUDIO_DEFECTO}%{porcentaje !== PORCENTAJE_ESTUDIO_DEFECTO && <> · <button type="button" className="estudio-link" onClick={() => setPorcentaje(PORCENTAJE_ESTUDIO_DEFECTO)}>restablecer</button></>}</small>
          </label>
        </fieldset>

        <div className="estudio-result" aria-live="polite">
          <dl>
            {tipo === 'LIBRANZA' ? (
              <>
                <div><dt>Salario − aportes de ley</dt><dd>{formatMoney(resultado.netoBase)}</dd></div>
                <div><dt>÷ 2 = Mínimo variable</dt><dd>{formatMoney(resultado.minimoVariable)}</dd></div>
                <div><dt>− Deducciones de nómina = Disponible</dt><dd className={resultado.disponible < 0 ? 'neg' : ''}>{formatMoney(resultado.disponible)}</dd></div>
              </>
            ) : (
              <>
                <div><dt>Ingresos − centrales de riesgo</dt><dd>{formatMoney(resultado.netoBase)}</dd></div>
                <div><dt>÷ 2 = Disponible</dt><dd className={resultado.disponible < 0 ? 'neg' : ''}>{formatMoney(resultado.disponible)}</dd></div>
              </>
            )}
            <div><dt>× {porcentaje}%</dt><dd /></div>
          </dl>
          <div className="estudio-total">
            <span>Cuota máxima a prestar</span>
            <strong>{formatMoney(resultado.cuotaMaxima)}</strong>
          </div>
          <div className="estudio-compare">
            <span>Cuota estimada del crédito</span>
            <strong>{cuota != null ? formatMoney(cuota) : '—'}</strong>
          </div>
          {hasData && (
            <p className={`estudio-verdict ${viable ? 'ok' : 'bad'}`}>
              {viable ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
              {viable ? 'La cuota cabe en la capacidad de pago.' : 'La cuota supera la capacidad de pago.'}
            </p>
          )}
        </div>
      </div>

      {!readOnly && <div className="estudio-actions">
        <label className="estudio-field estudio-obs">
          <span>Observación del estudio (opcional)</span>
          <textarea rows={2} maxLength={1000} value={observacion} onChange={(event) => setObservacion(event.target.value)} />
        </label>
        <button type="button" className="stage-btn-primary" disabled={saving || !hasData} onClick={guardar}>
          {saving ? 'Guardando…' : 'Guardar estudio'}
        </button>
      </div>}
      {error && <p className="estudio-error" role="alert">{error}</p>}

      {ultimo && (
        <div className="estudio-history">
          <h4>Estudios guardados</h4>
          <ul>
            {estudios.map((item) => (
              <li key={item.id}>
                <span className={`chip ${item.viable ? 'ok' : 'bad'}`}>{item.viable ? 'Viable' : 'No viable'}</span>
                <span>{item.tipo === 'LIBRANZA' ? 'Libranza' : 'Libre inversión'} · {item.porcentaje}%</span>
                <strong>{formatMoney(item.cuotaMaxima)}</strong>
                <small>{formatDateTime(item.fecha)}{item.usuario ? ` · ${item.usuario}` : ''}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
