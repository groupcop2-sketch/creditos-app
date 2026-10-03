import React, { useState } from 'react';
import type { DocuSignEnvelopeDetail, DocuSignEstado } from '../../api';
import { api } from '../../api';
import {
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  PenTool,
  XCircle,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Info,
  Hash,
  User,
  Mail,
  Calendar
} from 'lucide-react';

interface Props {
  envelope: DocuSignEnvelopeDetail;
  token: string;
  onRefresh: () => void;
  onClose?: () => void;
}

const ORDERED_STEPS: Array<{
  key: DocuSignEstado;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'DRAFT',
    label: 'Borrador',
    sublabel: 'Documentos estructurados',
    icon: <FileText size={18} />
  },
  {
    key: 'SENT',
    label: 'Enviado',
    sublabel: 'Notificación emitida',
    icon: <Mail size={18} />
  },
  {
    key: 'DELIVERED',
    label: 'Entregado / Visto',
    sublabel: 'Abierto por el cliente',
    icon: <Eye size={18} />
  },
  {
    key: 'COMPLETED',
    label: 'Firmado & Sellado',
    sublabel: 'Sello SHA-256 inmutable',
    icon: <CheckCircle2 size={18} />
  }
];

export const DocuSignStateMachine: React.FC<Props> = ({
  envelope,
  token,
  onRefresh,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const isTerminal = ['COMPLETED', 'DECLINED', 'VOIDED', 'EXPIRED'].includes(envelope.estado);
  const isFailed = ['DECLINED', 'VOIDED', 'EXPIRED'].includes(envelope.estado);

  const getStepStatus = (stepKey: DocuSignEstado) => {
    if (envelope.estado === stepKey) return 'active';

    if (envelope.estado === 'COMPLETED') {
      return 'completed';
    }

    if (envelope.estado === 'DELIVERED') {
      if (stepKey === 'DRAFT' || stepKey === 'SENT') return 'completed';
      return 'pending';
    }

    if (envelope.estado === 'SENT') {
      if (stepKey === 'DRAFT') return 'completed';
      return 'pending';
    }

    if (isFailed) {
      if (stepKey === 'DRAFT' || stepKey === 'SENT') return 'completed';
      return 'canceled';
    }

    return 'pending';
  };

  const handleSimulate = async (action: 'OPEN' | 'SIGN' | 'DECLINE' | 'VOID') => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.simulateDocuSignAction(
        token,
        envelope.envelopeId,
        action,
        action === 'DECLINE' ? (rejectionReason || 'Desacuerdo con plazo o cuota fijada') : undefined
      );
      setSuccessMessage(
        action === 'OPEN'
          ? 'Sobre marcado como ENTREGADO / VISTO por el firmante.'
          : action === 'SIGN'
          ? '¡Sobre FIRMADO exitosamente! Se generó el PDF combinado y el certificado criptográfico.'
          : action === 'DECLINE'
          ? 'Sobre marcado como RECHAZADO por el firmante.'
          : 'Sobre ANULADO administrativamente.'
      );
      setShowRejectInput(false);
      onRefresh();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al simular la acción');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDoc = async (docId: number, nombre: string) => {
    try {
      const blob = await api.getDocuSignDocPdfBlob(token, envelope.envelopeId, docId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar el documento');
    }
  };

  const handleDownloadCombined = async () => {
    try {
      const blob = await api.getDocuSignCombinedPdfBlob(token, envelope.envelopeId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DOCUSIGN_FIRMADO_${envelope.consecutivo || envelope.envelopeId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar documento firmado');
    }
  };

  return (
    <div className="docusign-machine-card" style={{
      background: 'linear-gradient(180deg, #0d1b2a 0%, #102437 100%)',
      color: '#ffffff',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: envelope.modo === 'SIMULACION' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(16, 185, 129, 0.2)',
              color: envelope.modo === 'SIMULACION' ? '#fde047' : '#6ee7b7',
              border: envelope.modo === 'SIMULACION' ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.5px'
            }}>
              {envelope.modo === 'SIMULACION' ? '🧪 SIMULACIÓN ACTIVA' : '🟢 DOCUSIGN LIVE'}
            </span>
            <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
              Crédito <strong style={{ color: '#ffffff' }}>#{envelope.consecutivo}</strong>
            </span>
          </div>

          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px' }}>
            {envelope.asunto}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: '#94a3b8' }}>
            <span><strong style={{ color: '#cbd5e1' }}>Sobre ID:</strong> {envelope.envelopeId}</span>
            <span><strong style={{ color: '#cbd5e1' }}>Firmante:</strong> {envelope.firmanteNombre} ({envelope.firmanteCorreo})</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '8px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Actualizar
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '0.85rem' }}>
          ⚠️ {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#6ee7b7', fontSize: '0.85rem' }}>
          ✓ {successMessage}
        </div>
      )}

      {/* VISUAL STATE MACHINE TRACKER */}
      <div style={{ margin: '30px 0 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#38bdf8' }}>
            MÁQUINA DE ESTADOS · DOCUSIGN LIFECYCLE
          </span>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: '999px',
            background:
              envelope.estado === 'COMPLETED' ? '#059669' :
              envelope.estado === 'DELIVERED' ? '#0284c7' :
              envelope.estado === 'SENT' ? '#d97706' :
              envelope.estado === 'DECLINED' ? '#dc2626' :
              envelope.estado === 'VOIDED' ? '#6b7280' : '#475569',
            color: '#ffffff'
          }}>
            ESTADO ACTUAL: {envelope.estado}
          </span>
        </div>

        {/* Step Nodes Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', position: 'relative' }}>
          {ORDERED_STEPS.map((step, idx) => {
            const status = getStepStatus(step.key);
            const isCurrent = status === 'active';
            const isDone = status === 'completed';

            return (
              <div
                key={step.key}
                style={{
                  background: isCurrent
                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.25) 0%, rgba(2, 132, 199, 0.15) 100%)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: isCurrent
                    ? '2px solid #38bdf8'
                    : isDone
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  position: 'relative',
                  boxShadow: isCurrent ? '0 0 20px rgba(56, 189, 248, 0.25)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isCurrent ? '#0284c7' : isDone ? '#059669' : 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff'
                  }}>
                    {isDone ? <CheckCircle2 size={18} /> : step.icon}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isCurrent ? '#38bdf8' : isDone ? '#34d399' : '#64748b' }}>
                    PASO {idx + 1}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                  {step.label}
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: isCurrent ? '#bae6fd' : '#94a3b8' }}>
                  {step.sublabel}
                </p>

                {isCurrent && (
                  <div style={{
                    marginTop: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.7rem',
                    color: '#38bdf8',
                    fontWeight: 700
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#38bdf8',
                      boxShadow: '0 0 8px #38bdf8'
                    }} />
                    En curso
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Failed / Terminal Branch Alert if Rejected or Voided */}
        {isFailed && (
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            borderRadius: '10px',
            background: envelope.estado === 'DECLINED' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(107, 114, 128, 0.2)',
            border: envelope.estado === 'DECLINED' ? '1px solid #ef4444' : '1px solid #6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <XCircle size={22} color={envelope.estado === 'DECLINED' ? '#ef4444' : '#9ca3af'} />
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#ffffff' }}>
                Rama Terminal: {envelope.estado === 'DECLINED' ? 'Proceso Rechazado por el Firmante' : 'Sobre Anulado / Cancelado'}
              </strong>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Motivo registrado: {envelope.motivoRechazo || envelope.motivoAnulacion || 'Sin motivo especificado'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SIMULATOR TOOLBAR */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
        margin: '24px 0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#fbbf24' }}>
              SIMULADOR INTERACTIVO DE EVENTOS DOCUSIGN
            </span>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#cbd5e1' }}>
              Prueba la transición de estados sin consumir llamadas a producción ni requerir token de cliente.
            </p>
          </div>
          {envelope.signUrl && (
            <a
              href={envelope.signUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ExternalLink size={14} /> Abrir Portal de Firma
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {envelope.estado === 'SENT' && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulate('OPEN')}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Eye size={16} /> 1. Simular Apertura del Documento (DELIVERED)
            </button>
          )}

          {(envelope.estado === 'SENT' || envelope.estado === 'DELIVERED') && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulate('SIGN')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <PenTool size={16} /> 2. Simular Firma Exitosa del Deudor (COMPLETED)
            </button>
          )}

          {!isTerminal && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowRejectInput(!showRejectInput)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={16} /> Simular Rechazo por el Deudor
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSimulate('VOID')}
                style={{
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.4)',
                  color: '#d1d5db',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Anular Sobre
              </button>
            </>
          )}

          {envelope.estado === 'COMPLETED' && (
            <button
              type="button"
              onClick={handleDownloadCombined}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} /> Descargar Pagaré + Contrato Firmado (PDF con Sello SHA-256)
            </button>
          )}
        </div>

        {showRejectInput && !isTerminal && (
          <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
            <input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Indica el motivo de rechazo (ej. Desacuerdo con tasa o valor de cuota)..."
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSimulate('DECLINE')}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Confirmar Rechazo
            </button>
          </div>
        )}
      </div>

      {/* DOCUMENTOS DEL SOBRE (PAGARÉ & CONTRATO) */}
      <div style={{ margin: '24px 0' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="#38bdf8" /> Documentos Vinculados al Sobre ({envelope.documentos?.length || 0})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {(envelope.documentos || []).map((doc) => (
            <div
              key={doc.id}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: doc.tipoDocumento === 'PAGARE' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(52, 211, 153, 0.2)',
                  color: doc.tipoDocumento === 'PAGARE' ? '#38bdf8' : '#34d399',
                  display: 'inline-block',
                  marginBottom: '4px'
                }}>
                  {doc.tipoDocumento}
                </span>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff' }}>
                  {doc.nombreArchivo}
                </strong>
                <small style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                  {doc.tamanoBytes ? `${Math.round(doc.tamanoBytes / 1024)} KB` : 'PDF Generado'}
                </small>
              </div>

              <button
                type="button"
                onClick={() => handleDownloadDoc(doc.id, doc.nombreArchivo)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#38bdf8',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}
              >
                <Download size={13} /> Ver PDF
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AUDIT TRAIL / HISTORIAL DE EVENTOS */}
      <div>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="#34d399" /> Trazabilidad & Certificado de Auditoría (Ley 527 de 1999)
        </h3>
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>Fecha y Hora</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>Acción / Evento</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>Transición</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>Actor</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8', fontWeight: 700 }}>Detalle / IP</th>
              </tr>
            </thead>
            <tbody>
              {(envelope.eventos || []).map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                    {new Date(ev.fechaEvento).toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: ev.estadoNuevo === 'COMPLETED' ? '#34d399' : ev.estadoNuevo === 'DECLINED' ? '#f87171' : '#38bdf8'
                    }}>
                      {ev.accion}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                    {ev.estadoAnterior ? `${ev.estadoAnterior} → ` : ''}
                    <strong style={{ color: '#ffffff' }}>{ev.estadoNuevo}</strong>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                    {ev.actor}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                    {ev.descripcion || 'Evento de ciclo de vida'}
                    {ev.ipAddress ? ` (IP: ${ev.ipAddress})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
