import React, { useState, useEffect, useMemo } from 'react';
import type { DocuSignEnvelopeItem, DocuSignEnvelopeDetail, DocuSignConfig } from '../../api';
import { api } from '../../api';
import { DocuSignStateMachine } from './DocuSignStateMachine';
import {
  FileSignature,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
  FileText,
  Download,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  TrendingUp,
  Settings,
  Sparkles
} from 'lucide-react';

interface Props {
  token: string;
}

export const DocuSignFirmasView: React.FC<Props> = ({ token }) => {
  const [envelopes, setEnvelopes] = useState<DocuSignEnvelopeItem[]>([]);
  const [selectedEnvelope, setSelectedEnvelope] = useState<DocuSignEnvelopeDetail | null>(null);
  const [config, setConfig] = useState<DocuSignConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creditsList, setCreditsList] = useState<Array<{ id: number; consecutivo: string; cliente: string; identificacion: string; correo: string; telefono: string; monto: number }>>([]);

  // Form State
  const [formCreditoId, setFormCreditoId] = useState<number | ''>('');
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formIdentificacion, setFormIdentificacion] = useState('');
  const [formAsunto, setFormAsunto] = useState('');
  const [formMensaje, setFormMensaje] = useState('');
  const [includePagare, setIncludePagare] = useState(true);
  const [includeContrato, setIncludeContrato] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [envList, cfg] = await Promise.all([
        api.listDocuSignEnvelopes(token, { estado: statusFilter }),
        api.getDocuSignConfig(token).catch(() => null)
      ]);
      setEnvelopes(envList);
      if (cfg) setConfig(cfg);
    } catch (err) {
      console.error('Error loading DocuSign data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCredits = async () => {
    try {
      const creds = await api.listCreditos(token);
      setCreditsList(
        (creds || []).map((c: any) => ({
          id: c.id ?? c.idCredito,
          consecutivo: c.consecutivo || `CR-${c.id ?? c.idCredito}`,
          cliente: c.nombreCliente || c.v_nombre_cliente || 'Sin nombre',
          identificacion: c.identificacionCliente || c.v_identificacion_cliente || '',
          correo: c.correoCliente || c.v_correo_cliente || '',
          telefono: c.telefonoCliente || c.v_telefono_cliente || '',
          monto: Number(c.montoSolicitado || c.val_monto_solicitado || 0)
        }))
      );
    } catch (err) {
      console.warn('Could not load credits list:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadCredits();
  }, [token, statusFilter]);

  const handleSelectCredit = (creditId: number) => {
    setFormCreditoId(creditId);
    const found = creditsList.find((c) => c.id === creditId);
    if (found) {
      setFormNombre(found.cliente);
      setFormIdentificacion(found.identificacion);
      setFormCorreo(found.correo || `${found.identificacion || 'cliente'}@ejemplo.com`);
      setFormTelefono(found.telefono || '3000000000');
      setFormAsunto(`Firma digital de Pagaré y Contrato de Crédito - ${found.consecutivo}`);
      setFormMensaje(`Apreciado(a) ${found.cliente}, adjuntamos para su firma electrónica el pagaré y contrato de su crédito.`);
    }
  };

  const handleCreateEnvelope = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCreditoId || !formNombre || !formCorreo) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    setCreating(true);
    setActionMessage(null);
    try {
      const docsTipos: Array<'PAGARE' | 'CONTRATO'> = [];
      if (includePagare) docsTipos.push('PAGARE');
      if (includeContrato) docsTipos.push('CONTRATO');

      const created = await api.createDocuSignEnvelope(token, {
        creditoId: Number(formCreditoId),
        firmanteNombre: formNombre,
        firmanteCorreo: formCorreo,
        firmanteTelefono: formTelefono || null,
        firmanteIdentificacion: formIdentificacion || null,
        asunto: formAsunto,
        mensaje: formMensaje,
        documentosTipos: docsTipos
      });

      setActionMessage({
        type: 'success',
        text: `¡Sobre generado exitosamente! ID: ${created.envelopeId}. Listo para simular o firmar.`
      });
      setShowCreateModal(false);
      setSelectedEnvelope(created);
      loadData();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al crear el sobre DocuSign'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleOpenDetail = async (envelopeId: string) => {
    try {
      const detail = await api.getDocuSignEnvelopeDetail(token, envelopeId);
      setSelectedEnvelope(detail);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo cargar el detalle del sobre');
    }
  };

  const filteredEnvelopes = useMemo(() => {
    return envelopes.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        item.envelopeId.toLowerCase().includes(q) ||
        item.firmanteNombre.toLowerCase().includes(q) ||
        item.consecutivo.toLowerCase().includes(q) ||
        (item.firmanteIdentificacion || '').toLowerCase().includes(q) ||
        (item.firmanteCorreo || '').toLowerCase().includes(q)
      );
    });
  }, [envelopes, searchTerm]);

  // Metrics
  const metrics = useMemo(() => {
    const total = envelopes.length;
    const completed = envelopes.filter((e) => e.estado === 'COMPLETED').length;
    const inProgress = envelopes.filter((e) => e.estado === 'SENT' || e.estado === 'DELIVERED').length;
    const declined = envelopes.filter((e) => e.estado === 'DECLINED').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, declined, rate };
  }, [envelopes]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="docusign-module-container" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Title & Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0b1e36 0%, #17365d 100%)',
        color: '#ffffff',
        padding: '28px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
              <FileSignature size={14} /> DOCUSIGN eSIGNATURE REST API (v2.1)
            </div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Centro de Firmas Digitales & Máquina de Estados
            </h1>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#cbd5e1', maxWidth: '780px', lineHeight: 1.5 }}>
              Gestión y envío automatizado de paquetes contractuales (<strong>Pagaré en Blanco con Carta de Instrucciones</strong> y <strong>Contrato de Mutuo Comercial</strong>) con trazabilidad criptográfica y auditoría jurídica en tiempo real.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                if (creditsList.length > 0) handleSelectCredit(creditsList[0].id);
              }}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 22px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
              }}
            >
              <Plus size={18} /> + Nuevo Envío a Firma (Pagaré + Contrato)
            </button>
          </div>
        </div>

        {/* Environment status chip */}
        <div style={{
          marginTop: '22px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
          fontSize: '0.8rem'
        }}>
          <span style={{
            background: 'rgba(234, 179, 8, 0.2)',
            color: '#fef08a',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            padding: '3px 10px',
            borderRadius: '6px',
            fontWeight: 800
          }}>
            🧪 MODO SIMULACIÓN ACTIVO
          </span>
          <span style={{ color: '#94a3b8' }}>
            Servidor: <code style={{ color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{config?.authServer || 'account-d.docusign.com'}</code>
          </span>
          <span style={{ color: '#94a3b8' }}>
            Documentos generados: <strong style={{ color: '#38bdf8' }}>Pagaré No. PG + Contrato No. CT</strong>
          </span>
          <span style={{ color: '#94a3b8' }}>
            Sello criptográfico: <strong style={{ color: '#34d399' }}>SHA-256 Inmutable</strong>
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="surface" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #0284c7' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Sobres Enviados</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{metrics.total}</h3>
          <small style={{ color: '#64748b' }}>Pagarés y Contratos procesados</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>En Proceso de Firma</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>{metrics.inProgress}</h3>
          <small style={{ color: '#64748b' }}>Estados SENT / DELIVERED</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Firmados Exitosamente</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#059669' }}>{metrics.completed}</h3>
          <small style={{ color: '#059669', fontWeight: 600 }}>100% Sellados con SHA-256</small>
        </div>

        <div className="surface" style={{ padding: '20px', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tasa de Completitud</span>
          <h3 style={{ margin: '6px 0 0 0', fontSize: '1.8rem', fontWeight: 800, color: '#4f46e5' }}>{metrics.rate}%</h3>
          <small style={{ color: '#64748b' }}>Ratio de éxito de formalización</small>
        </div>
      </div>

      {actionMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '14px 18px',
          borderRadius: '10px',
          background: actionMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${actionMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: actionMessage.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{actionMessage.text}</span>
          <button type="button" onClick={() => setActionMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* DETAIL MODAL / DRAWER (INTERACTIVE STATE MACHINE) */}
      {selectedEnvelope && (
        <div style={{ marginBottom: '28px' }}>
          <DocuSignStateMachine
            envelope={selectedEnvelope}
            token={token}
            onRefresh={() => handleOpenDetail(selectedEnvelope.envelopeId)}
            onClose={() => setSelectedEnvelope(null)}
          />
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="surface" style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por sobre ID, deudor, cédula o crédito..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: '#ffffff'
            }}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="SENT">Enviados (SENT)</option>
            <option value="DELIVERED">Entregados / Vistos (DELIVERED)</option>
            <option value="COMPLETED">Firmados (COMPLETED)</option>
            <option value="DECLINED">Rechazados (DECLINED)</option>
            <option value="VOIDED">Anulados (VOIDED)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '9px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refrescar
        </button>
      </div>

      {/* Main Envelopes Table */}
      <div className="surface" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 18px', fontWeight: 800, color: '#334155' }}>Sobre DocuSign</th>
              <th style={{ padding: '14px 18px', fontWeight: 800, color: '#334155' }}>Crédito</th>
              <th style={{ padding: '14px 18px', fontWeight: 800, color: '#334155' }}>Firmante / Deudor</th>
              <th style={{ padding: '14px 18px', fontWeight: 800, color: '#334155' }}>Documentos</th>
              <th style={{ padding: '14px 18px', fontWeight: 800, color: '#334155' }}>Estado (Máquina)</th>
              <th style={{ padding: '14px 18px', fontWeight: 800, color: '#334155' }}>Fechas</th>
              <th style={{ padding: '14px 18px', fontWeight: 800, color: '#334155', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnvelopes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No se encontraron sobres de firma DocuSign. Haz clic en <strong>"+ Nuevo Envío a Firma"</strong> para emitir el Pagaré y Contrato.
                </td>
              </tr>
            ) : (
              filteredEnvelopes.map((env) => {
                const isCompleted = env.estado === 'COMPLETED';
                const isDelivered = env.estado === 'DELIVERED';
                const isSent = env.estado === 'SENT';
                const isDeclined = env.estado === 'DECLINED';

                const badgeBg =
                  isCompleted ? '#ecfdf5' :
                  isDelivered ? '#e0f2fe' :
                  isSent ? '#fef3c7' :
                  isDeclined ? '#fef2f2' : '#f1f5f9';

                const badgeColor =
                  isCompleted ? '#065f46' :
                  isDelivered ? '#0369a1' :
                  isSent ? '#92400e' :
                  isDeclined ? '#991b1b' : '#475569';

                return (
                  <tr key={env.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <strong style={{ color: '#0f172a', display: 'block', fontFamily: 'monospace' }}>
                        {env.envelopeId}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{env.modo}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <strong style={{ color: '#0284c7' }}>#{env.consecutivo}</strong>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <strong style={{ display: 'block', color: '#1e293b' }}>{env.firmanteNombre}</strong>
                      <small style={{ color: '#64748b' }}>
                        {env.firmanteCorreo} {env.firmanteIdentificacion ? `· C.C. ${env.firmanteIdentificacion}` : ''}
                      </small>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          PAGARÉ
                        </span>
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          CONTRATO
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        background: badgeBg,
                        color: badgeColor,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: badgeColor
                        }} />
                        {env.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '0.75rem', color: '#64748b' }}>
                      <div>Envío: {env.fechaEnvio ? new Date(env.fechaEnvio).toLocaleDateString('es-CO') : '-'}</div>
                      {env.fechaFirma && (
                        <div style={{ color: '#059669', fontWeight: 700 }}>
                          Firma: {new Date(env.fechaFirma).toLocaleDateString('es-CO')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(env.envelopeId)}
                        style={{
                          background: '#0284c7',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Layers size={13} /> Ver Máquina de Estados
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE ENVELOPE MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ORIGINACIÓN DOCUSIGN · MULTI-DOCUMENTO
                </span>
                <h2 style={{ margin: '2px 0 0 0', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  Enviar Pagaré y Contrato de Crédito a Firma
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEnvelope}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Seleccionar Crédito Radicado *
                </label>
                <select
                  value={formCreditoId}
                  onChange={(e) => handleSelectCredit(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                  required
                >
                  <option value="">Selecciona un crédito...</option>
                  {creditsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.consecutivo} - {c.cliente} (C.C. {c.identificacion}) - {formatCurrency(c.monto)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Nombre del Firmante / Deudor *
                  </label>
                  <input
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Cédula / Identificación *
                  </label>
                  <input
                    value={formIdentificacion}
                    onChange={(e) => setFormIdentificacion(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Correo Electrónico (Notificación DocuSign) *
                  </label>
                  <input
                    type="email"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Teléfono Celular
                  </label>
                  <input
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Document Selection */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  Documentos a incluir en el sobre DocuSign:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includePagare}
                      onChange={(e) => setIncludePagare(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span><strong>Pagaré en Blanco con Carta de Instrucciones (Título Valor)</strong> - Obligatorio para exigibilidad</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeContrato}
                      onChange={(e) => setIncludeContrato(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span><strong>Contrato de Mutuo Comercial de Crédito</strong> - Términos financieros, libranza y garantía</span>
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Asunto del Correo
                </label>
                <input
                  value={formAsunto}
                  onChange={(e) => setFormAsunto(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Mensaje personalizado para el firmante
                </label>
                <textarea
                  value={formMensaje}
                  onChange={(e) => setFormMensaje(e.target.value)}
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || (!includePagare && !includeContrato)}
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  {creating ? 'Generando Documentos y Sobre...' : '🚀 Emitir y Enviar Sobre DocuSign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
