import React, { useEffect, useState } from 'react';
import { Eye, FileCheck2, Check, X } from 'lucide-react';
import { api, type SoporteClienteRow, type SoportesClienteResponse } from '../../api';
import { openDocument } from '../DocumentViewer';

type Props = {
  token: string;
  creditoId: number;
  readOnly?: boolean;
  formatMoney: (val?: number | null) => string;
  onPendientesChange: (pendientes: number, total: number) => void;
};

const TIPO_LABEL: Record<SoporteClienteRow['tipo'], string> = {
  CEDULA_FRENTE: 'Cédula · frente',
  CEDULA_REVERSO: 'Cédula · reverso',
  FOTO_ROSTRO: 'Foto del rostro (selfie)',
  CERTIFICADO_COMPRA_CARTERA: 'Certificado de deuda'
};

const MODALIDAD_LABEL = { EFECTIVO: 'Efectivo', COMPRA_CARTERA: 'Compra de cartera', MIXTO: 'Mixto (efectivo + compra de cartera)' };

export const SoportesClientePanel: React.FC<Props> = ({ token, creditoId, readOnly = false, formatMoney, onPendientesChange }) => {
  const [data, setData] = useState<SoportesClienteResponse | null>(null);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const apply = (next: SoportesClienteResponse) => {
    setData(next);
    const requeridos = next.soportes.length + next.faltantes.length;
    onPendientesChange(next.soportes.filter((item) => item.estado !== 'APROBADO').length + next.faltantes.length, requeridos);
  };

  useEffect(() => {
    api.listSoportesCliente(token, creditoId)
      .then(apply)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos del cliente'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, creditoId]);

  const revisar = async (soporte: SoporteClienteRow, estado: 'APROBADO' | 'RECHAZADO') => {
    setBusy(true);
    setError('');
    try {
      apply(await api.revisarSoporteCliente(token, soporte.id, { estado, observacion: estado === 'RECHAZADO' ? motivo : undefined }));
      setRejecting(null);
      setMotivo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el documento');
    } finally {
      setBusy(false);
    }
  };

  const abrir = async (soporte: SoporteClienteRow) => {
    try {
      openDocument(await api.getSoporteClienteArchivo(token, soporte.id), soporte.nombreArchivo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el archivo');
    }
  };

  if (!data) return <div className="soportes-panel">{error ? <p className="estudio-error" role="alert">{error}</p> : <p className="muted-note">Cargando documentos del cliente…</p>}</div>;

  const entidadDe = (idCompra: number | null) => data.compras.find((item) => item.id === idCompra);
  const aprobados = data.soportes.filter((item) => item.estado === 'APROBADO').length;

  return (
    <section className="soportes-panel" aria-labelledby="soportes-title">
      <header className="estudio-header">
        <div>
          <h3 id="soportes-title"><FileCheck2 size={18} aria-hidden="true" /> Documentos cargados por el cliente</h3>
          <p>
            {aprobados} de {data.soportes.length + data.faltantes.length} aprobados.
            {readOnly ? ' Etapa cerrada: solo consulta.' : ' Revisa cada archivo y apruébalo o recházalo indicando el motivo; los rechazados y faltantes los puede cargar el cliente desde el portal.'}
          </p>
        </div>
      </header>

      <div className="soportes-modalidad">
        <div><span>Modalidad</span><strong>{MODALIDAD_LABEL[data.modalidad]}</strong></div>
        {data.modalidad !== 'EFECTIVO' && <div><span>Compra de cartera</span><strong>{formatMoney(data.valorCompraCartera)}</strong></div>}
        {data.modalidad !== 'COMPRA_CARTERA' && <div><span>Efectivo al cliente</span><strong>{formatMoney(data.valorEfectivo)}</strong></div>}
      </div>

      {data.soportes.length === 0 && data.faltantes.length === 0 ? (
        <p className="muted-note">Esta solicitud no requiere documentos del cliente.</p>
      ) : (
        <div className="modern-docs-table-container">
          <table className="modern-docs-table">
            <thead>
              <tr><th>Documento</th><th>Archivo</th><th>Estado</th><th style={{ textAlign: 'right' }}>Acciones</th></tr>
            </thead>
            <tbody>
              {data.soportes.map((soporte) => {
                const compra = entidadDe(soporte.idCompraCartera);
                return (
                  <tr key={soporte.id}>
                    <td>
                      <strong>{TIPO_LABEL[soporte.tipo]}</strong>
                      {compra && <div className="soporte-sub">{compra.entidad} · {formatMoney(compra.valor)}</div>}
                      {soporte.estado === 'RECHAZADO' && soporte.observacion && <div className="soporte-sub bad">Motivo: {soporte.observacion}</div>}
                    </td>
                    <td className="soporte-sub">{soporte.nombreArchivo}</td>
                    <td><span className={`chip ${soporte.estado === 'APROBADO' ? 'ok' : soporte.estado === 'RECHAZADO' ? 'bad' : 'warn'}`}>{soporte.estado}</span></td>
                    <td>
                      {rejecting === soporte.id ? (
                        <div className="soporte-reject">
                          <input autoFocus value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Motivo del rechazo (se envía al cliente por correo)" aria-label="Motivo del rechazo" />
                          <button type="button" className="stage-btn-danger" disabled={busy || !motivo.trim()} onClick={() => revisar(soporte, 'RECHAZADO')}>Rechazar</button>
                          <button type="button" className="stage-btn-outline" onClick={() => { setRejecting(null); setMotivo(''); }}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="soporte-actions">
                          <button type="button" className="doc-action-btn" onClick={() => abrir(soporte)}><Eye size={14} aria-hidden="true" /> Ver</button>
                          {!readOnly && <>
                            <button type="button" className="doc-action-btn" disabled={busy || soporte.estado === 'APROBADO'} onClick={() => revisar(soporte, 'APROBADO')}><Check size={14} aria-hidden="true" /> Aprobar</button>
                            <button type="button" className="doc-action-btn" disabled={busy || soporte.estado === 'RECHAZADO'} onClick={() => setRejecting(soporte.id)}><X size={14} aria-hidden="true" /> Rechazar</button>
                          </>}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data.faltantes.map((faltante) => {
                const compra = entidadDe(faltante.idCompraCartera);
                return (
                  <tr key={`${faltante.tipo}-${faltante.idCompraCartera ?? 0}`}>
                    <td>
                      <strong>{TIPO_LABEL[faltante.tipo]}</strong>
                      {compra && <div className="soporte-sub">{compra.entidad} · {formatMoney(compra.valor)}</div>}
                    </td>
                    <td className="soporte-sub">Sin archivo</td>
                    <td><span className="chip bad">FALTA</span></td>
                    <td className="soporte-sub" style={{ textAlign: 'right' }}>El cliente debe cargarlo desde el portal</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {error && <p className="estudio-error" role="alert">{error}</p>}
    </section>
  );
};
