import React, { useState, useMemo, useRef } from 'react';
import type {
  CreditoRow,
  CreditoExpediente,
  CreditoDocumentoRow,
  CreditoEtapaRow,
  DocuSignEnvelopeDetail,
  FirmaCreditoRow,
  DocumentTemplateRow,
  FondeoDisponibleRow,
  EmployeeCatalogs,
  SecurityUser
} from '../../api';
import { DocuSignStateMachine } from '../docusign/DocuSignStateMachine';

export interface CreditDetailViewProps {
  credito: CreditoRow;
  expediente: CreditoExpediente | null;
  documentos: CreditoDocumentoRow[];
  etapas: CreditoEtapaRow[];
  selectedEtapaId: number | null;
  onSelectEtapa: (id: number) => void;
  observacionEtapa: string;
  onChangeObservacionEtapa: (value: string) => void;
  onUpdateEtapa: (estado: 'APROBADA' | 'DEVUELTA' | 'RECHAZADA') => Promise<void>;
  onUploadDocumento: (idDocumento: number, file?: File) => Promise<void>;
  onOpenDocumento: (idDocumento: number) => Promise<void>;
  onUpdateDocumentoEstado: (idDocumento: number, estado: 'APROBADO' | 'RECHAZADO') => Promise<void>;
  onOpenSendDocumentsModal: (documentoNombre?: string) => void;
  envelope: DocuSignEnvelopeDetail | null;
  onReloadEnvelope?: (envelopeId: string) => Promise<void>;
  onReloadCredito?: (creditoId: number) => Promise<void>;
  onDownloadSignedPdf?: (envelopeId: string) => Promise<void>;
  token: string;
  loading: boolean;
  formatMoney: (val?: number | null) => string;
  formatDateTime: (val?: string | null) => string;
  onBack: () => void;
  currentUser?: SecurityUser | null;

  // Extra stage handler props
  creditoDecisionForm?: {
    montoAprobado: string;
    plazoAprobado: string;
    tasaAprobada: string;
    cuotaAprobada: string;
    observacion: string;
  };
  onChangeDecisionForm?: React.Dispatch<React.SetStateAction<{
    montoAprobado: string;
    plazoAprobado: string;
    tasaAprobada: string;
    cuotaAprobada: string;
    observacion: string;
  }>>;
  onDecideCredito?: (decision: 'APROBADO' | 'DEVUELTO' | 'RECHAZADO') => Promise<void>;
  monthOptions?: number[];

  creditoDesembolsoForm?: {
    valorDesembolso: string;
    fechaDesembolso: string;
    fechaPrimeraCuota: string;
    periodicidad: string;
    diaCorte: string;
    diaPagoOportuno: string;
    moraDespuesVencimiento: string;
    ajustarFinSemana: boolean;
    idInversion: string;
    valorFondeo: string;
    bancoDestino: string;
    tipoCuenta: string;
    numeroCuenta: string;
    referenciaPago: string;
    numeroOrden: string;
    comprobantePago: string;
    observacionCalendario: string;
    observacion: string;
  };
  onChangeDesembolsoForm?: React.Dispatch<React.SetStateAction<any>>;
  onRegistrarDesembolso?: () => Promise<void>;
  fondeoDisponible?: FondeoDisponibleRow[];
  employeeCatalogs?: EmployeeCatalogs;

  liquidacionDefinitivaActual?: any;
  onRegistrarLiquidacionDefinitiva?: () => Promise<void>;
  onAnularLiquidacionDefinitiva?: (id: number) => Promise<void>;

  creditoFirmas?: FirmaCreditoRow[];
  documentTemplates?: DocumentTemplateRow[];
  onOpenFirmaPdf?: (id: number) => Promise<void>;
  onFirmaManualEstado?: (id: number, estado: string) => Promise<void>;
}

export const CreditDetailView: React.FC<CreditDetailViewProps> = ({
  credito,
  expediente,
  documentos,
  etapas,
  selectedEtapaId,
  onSelectEtapa,
  observacionEtapa,
  onChangeObservacionEtapa,
  onUpdateEtapa,
  onUploadDocumento,
  onOpenDocumento,
  onUpdateDocumentoEstado,
  onOpenSendDocumentsModal,
  envelope,
  onReloadEnvelope,
  onReloadCredito,
  onDownloadSignedPdf,
  token,
  loading,
  formatMoney,
  formatDateTime,
  onBack,
  currentUser,
  creditoDecisionForm,
  onChangeDecisionForm,
  onDecideCredito,
  monthOptions = [6, 12, 18, 24, 36, 48, 60, 72, 84],
  creditoDesembolsoForm,
  onChangeDesembolsoForm,
  onRegistrarDesembolso,
  fondeoDisponible = [],
  employeeCatalogs,
  liquidacionDefinitivaActual,
  onRegistrarLiquidacionDefinitiva,
  onAnularLiquidacionDefinitiva,
  creditoFirmas = [],
  onOpenFirmaPdf,
  onFirmaManualEstado
}) => {
  const [activeTab, setActiveTab] = useState<'documentos' | 'observaciones' | 'historial' | 'docusign'>('documentos');
  const [infoAccordionOpen, setInfoAccordionOpen] = useState(true);
  const [liquidacionAccordionOpen, setLiquidacionAccordionOpen] = useState(true);
  const [docSearch, setDocSearch] = useState('');
  const [openDocMenuId, setOpenDocMenuId] = useState<number | null>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Active Stage
  const activeEtapa = useMemo(() => {
    return etapas.find((item) => item.id === selectedEtapaId) ?? etapas[0] ?? null;
  }, [etapas, selectedEtapaId]);

  const isApprovalStage = useMemo(() => {
    const name = (activeEtapa?.etapa || '').toLowerCase();
    return name.includes('aprob') || name.includes('comite') || name.includes('analisis') || name.includes('estudio');
  }, [activeEtapa]);

  const isDisbursementStage = useMemo(() => {
    const name = (activeEtapa?.etapa || '').toLowerCase();
    return name.includes('desembol');
  }, [activeEtapa]);

  // Document calculations
  const docsAprobadosCount = useMemo(() => {
    return documentos.filter((d) => {
      const isSigned = envelope?.estado === 'COMPLETED';
      return isSigned || d.estadoDocumento === 'APROBADO' || d.estadoDocumento === 'FIRMADO';
    }).length;
  }, [documentos, envelope]);

  const totalDocsCount = documentos.length;
  const porcentajeAprobados = totalDocsCount > 0 ? Math.round((docsAprobadosCount / totalDocsCount) * 100) : 0;

  const mandatoryPendingCount = useMemo(() => {
    return documentos.filter((d) => {
      const isSigned = envelope?.estado === 'COMPLETED';
      const isApproved = isSigned || d.estadoDocumento === 'APROBADO' || d.estadoDocumento === 'FIRMADO';
      return d.obligatorio && !isApproved;
    }).length;
  }, [documentos, envelope]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!docSearch.trim()) return documentos;
    const q = docSearch.toLowerCase();
    return documentos.filter((d) => d.documento.toLowerCase().includes(q) || (d.archivoNombre && d.archivoNombre.toLowerCase().includes(q)));
  }, [documentos, docSearch]);

  // Canonical stages if etapas is empty
  const displayEtapas = useMemo(() => {
    if (etapas.length > 0) return etapas;
    return [
      { id: 1, etapa: 'Radicación', orden: 1, obligatoria: true, permiteDevolucion: false, responsable: 'SISTEMA', slaHoras: null, estadoEtapa: 'APROBADA', fechaInicio: credito.fechaRadicacion, fechaFin: credito.fechaRadicacion },
      { id: 2, etapa: 'Validación documental', orden: 2, obligatoria: true, permiteDevolucion: true, responsable: 'ANALISTA DE CRÉDITO', slaHoras: null, estadoEtapa: 'EN_PROCESO', fechaInicio: credito.fechaRadicacion, fechaFin: null },
      { id: 3, etapa: 'Estudio de crédito', orden: 3, obligatoria: true, permiteDevolucion: true, responsable: 'ANALISTA SENIOR', slaHoras: null, estadoEtapa: 'PENDIENTE', fechaInicio: null, fechaFin: null },
      { id: 4, etapa: 'Aprobación', orden: 4, obligatoria: true, permiteDevolucion: true, responsable: 'COMITÉ DE CRÉDITO', slaHoras: null, estadoEtapa: 'PENDIENTE', fechaInicio: null, fechaFin: null },
      { id: 5, etapa: 'Desembolso', orden: 5, obligatoria: true, permiteDevolucion: false, responsable: 'TESORERÍA', slaHoras: null, estadoEtapa: 'PENDIENTE', fechaInicio: null, fechaFin: null }
    ] as CreditoEtapaRow[];
  }, [etapas, credito]);

  const activeEtapaIndex = useMemo(() => {
    if (!activeEtapa) return 1;
    const idx = displayEtapas.findIndex((e) => e.id === activeEtapa.id);
    return idx >= 0 ? idx : 1;
  }, [displayEtapas, activeEtapa]);

  const getStageDescription = (etapaName?: string) => {
    const norm = (etapaName || '').toLowerCase();
    if (norm.includes('document')) return 'Revisa y valida los documentos requeridos para continuar con el proceso de crédito.';
    if (norm.includes('estudio')) return 'Analiza la capacidad de pago, historial crediticio y endeudamiento del solicitante.';
    if (norm.includes('aprob')) return 'Registra la decisión definitiva o votos requeridos del comité de crédito.';
    if (norm.includes('desembol')) return 'Gestiona la dispersión de fondos, cuenta bancaria y fondeo de inversionista.';
    return 'Gestiona las actividades correspondientes a esta etapa del flujo de crédito.';
  };

  const getClientInitials = (name?: string) => {
    if (!name) return 'EC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.slice(0, 2) || 'EC').toUpperCase();
  };

  return (
    <div className="credit-detail-page">
      {/* 1. TOP BAR: Breadcrumb, Search, Notifications, User */}
      <header className="credit-top-bar">
        <nav className="credit-breadcrumb" aria-label="Navegación secundaria">
          <button type="button" className="credit-breadcrumb-link" onClick={onBack} title="Volver a la lista de solicitudes">
            <span>&lt; Créditos</span>
          </button>
          <span className="credit-breadcrumb-separator">&gt;</span>
          <span className="credit-breadcrumb-current">Detalle del crédito</span>
        </nav>

        <div className="credit-top-right-group">
          <div className="credit-top-search">
            <span className="credit-top-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar créditos, clientes..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="credit-notification-bell"
            title="Notificaciones de alertas y novedades"
            onClick={() => alert('No hay nuevas alertas pendientes en este crédito.')}
          >
            🔔
            <span className="credit-notification-badge" />
          </button>

          <div className="credit-user-pill">
            <div className="credit-user-avatar">
              {currentUser?.fullName ? getClientInitials(currentUser.fullName) : 'EC'}
            </div>
            <div className="credit-user-details">
              <span className="credit-user-name">{currentUser?.fullName || 'Edwin Capdevilla'}</span>
              <span className="credit-user-role">{currentUser?.roles?.[0] || 'Analista de crédito'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO HEADER: Consecutivo, Estado, Fecha, Historial y Acciones */}
      <section className="credit-hero-header">
        <div className="credit-hero-title-group">
          <div className="credit-hero-main-title">
            <h1>Crédito #{credito.consecutivo}</h1>
            <span className={`credit-hero-badge status-${(credito.estado || 'en-proceso').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
              {credito.estado || 'EN PROCESO'}
            </span>
          </div>
          <p className="credit-hero-subtitle">
            Solicitado el {credito.fechaRadicacion ? credito.fechaRadicacion.slice(0, 10) : '25/09/2026'} · Por:{' '}
            <strong>{credito.nombreCliente}</strong>
          </p>
        </div>

        <div className="credit-hero-actions">
          <button
            type="button"
            className="credit-action-btn-secondary"
            onClick={() => setShowHistorialModal(true)}
            title="Ver trazabilidad de auditoría"
          >
            <span>↺</span> Historial
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="credit-action-btn-secondary"
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            >
              <span>⋮</span> Acciones <span>⌵</span>
            </button>

            {quickActionsOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
                  zIndex: 40,
                  minWidth: '220px',
                  overflow: 'hidden',
                  padding: '6px 0'
                }}
              >
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    fontSize: '0.82rem',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => {
                    setQuickActionsOpen(false);
                    onOpenSendDocumentsModal();
                  }}
                >
                  ✉️ Enviar documentos al correo
                </button>
                {envelope?.estado === 'COMPLETED' && onDownloadSignedPdf && (
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      fontSize: '0.82rem',
                      color: '#059669',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => {
                      setQuickActionsOpen(false);
                      void onDownloadSignedPdf(envelope.envelopeId);
                    }}
                  >
                    📄 Descargar PDF firmado
                  </button>
                )}
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    fontSize: '0.82rem',
                    color: '#1e293b',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onClick={() => {
                    setQuickActionsOpen(false);
                    setActiveTab('docusign');
                  }}
                >
                  🔄 Trazabilidad DocuSign
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. 5 QUICK METRIC SUMMARY CARDS ROW */}
      <section className="credit-kpi-row">
        {/* Card 1: Cliente */}
        <article className="credit-kpi-card">
          <div className="credit-kpi-icon blue">👤</div>
          <div className="credit-kpi-info">
            <span className="credit-kpi-label">Cliente</span>
            <strong className="credit-kpi-value" title={credito.nombreCliente}>{credito.nombreCliente}</strong>
            <span className="credit-kpi-sub">CC {credito.identificacionCliente}</span>
          </div>
        </article>

        {/* Card 2: Monto Solicitado */}
        <article className="credit-kpi-card">
          <div className="credit-kpi-icon green">$</div>
          <div className="credit-kpi-info">
            <span className="credit-kpi-label">Monto solicitado</span>
            <strong className="credit-kpi-value">{formatMoney(credito.montoSolicitado)}</strong>
            <span className="credit-kpi-sub">Neto: {formatMoney(expediente?.perfilCliente?.portal?.neto || credito.montoSolicitado)}</span>
          </div>
        </article>

        {/* Card 3: Correo */}
        <article className="credit-kpi-card">
          <div className="credit-kpi-icon blue">📄</div>
          <div className="credit-kpi-info">
            <span className="credit-kpi-label">Correo</span>
            <strong className="credit-kpi-value" title={expediente?.perfilCliente?.portal?.correo || credito.correoCliente || '-'}>
              {expediente?.perfilCliente?.portal?.correo || credito.correoCliente || '-'}
            </strong>
            <span className="credit-kpi-sub">Tel: {expediente?.perfilCliente?.portal?.telefono || credito.telefonoCliente || '-'}</span>
          </div>
        </article>

        {/* Card 4: Empresa */}
        <article className="credit-kpi-card">
          <div className="credit-kpi-icon blue">🏢</div>
          <div className="credit-kpi-info">
            <span className="credit-kpi-label">Empresa</span>
            <strong className="credit-kpi-value" title={expediente?.perfilCliente?.empresa?.razonSocial || credito.empresa || '-'}>
              {expediente?.perfilCliente?.empresa?.razonSocial || credito.empresa || 'Kaltire Colombia'}
            </strong>
            <span className="credit-kpi-sub">NIT {expediente?.perfilCliente?.empresa?.nit || '900.123.456-7'}</span>
          </div>
        </article>

        {/* Card 5: Personas a cargo */}
        <article className="credit-kpi-card">
          <div className="credit-kpi-icon purple">👥</div>
          <div className="credit-kpi-info">
            <span className="credit-kpi-label">Personas a cargo</span>
            <strong className="credit-kpi-value">{expediente?.perfilCliente?.empleado?.personasCargo ?? '0'}</strong>
            <span className="credit-kpi-sub">Vivienda: {expediente?.perfilCliente?.empleado?.tipoVivienda || '-'}</span>
          </div>
        </article>
      </section>

      {/* 4. HORIZONTAL CONNECTED STEPPER (PIPELINE) */}
      <section className="credit-stepper-card">
        <div className="credit-stepper">
          {displayEtapas.map((etapa, idx) => {
            const isCompleted = etapa.estadoEtapa === 'APROBADA' || idx < activeEtapaIndex;
            const isActive = activeEtapa?.id === etapa.id;
            const isPending = !isCompleted && !isActive;

            let statusClass = 'pending';
            if (isCompleted) statusClass = 'completed';
            else if (isActive) statusClass = 'active';

            return (
              <React.Fragment key={etapa.id}>
                <button
                  type="button"
                  className={`stepper-step ${statusClass}`}
                  onClick={() => onSelectEtapa(etapa.id)}
                  title={`Ver etapa: ${etapa.etapa}`}
                >
                  <div className="stepper-circle">
                    {isCompleted ? '✓' : etapa.orden || idx + 1}
                  </div>
                  <div className="stepper-labels">
                    <span className="stepper-title">{etapa.etapa}</span>
                    <span className="stepper-subtitle">
                      {isCompleted ? 'Aprobada' : isActive ? 'En proceso' : 'Pendiente'}
                    </span>
                  </div>
                </button>

                {idx < displayEtapas.length - 1 && (
                  <div className={`stepper-connector ${isCompleted ? 'completed' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* 5. MAIN 2-COLUMN GRID */}
      <div className="credit-main-grid">
        {/* LEFT COLUMN: Main Stage Card */}
        <div className="stage-main-card">
          {/* Stage Header */}
          <div className="stage-header">
            <div className="stage-header-left">
              <div className="stage-header-icon">📄</div>
              <div className="stage-header-titles">
                <h2>{activeEtapa?.etapa || 'Validación documental'}</h2>
                <p>{getStageDescription(activeEtapa?.etapa)}</p>
              </div>
            </div>

            <div className="stage-header-meta">
              <div className="stage-meta-item">
                <span className="stage-meta-label">Responsable</span>
                <span className="stage-meta-value">
                  👤 {activeEtapa?.responsable || 'ANALISTA DE CRÉDITO'}
                </span>
              </div>

              <div className="stage-meta-item">
                <span className="stage-meta-label">Inicio</span>
                <span className="stage-meta-value">
                  📅 {formatDateTime(activeEtapa?.fechaInicio) || '25/09/2026, 4:01 p. m.'}
                </span>
              </div>

              <span className="stage-header-badge">
                {activeEtapa?.estadoEtapa || 'EN PROCESO'}
              </span>
            </div>
          </div>

          {/* Stage Tabs Bar */}
          <div className="stage-tabs-bar">
            <button
              type="button"
              className={`stage-tab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
              onClick={() => setActiveTab('documentos')}
            >
              📄 Documentos ({documentos.length})
            </button>
            <button
              type="button"
              className={`stage-tab-btn ${activeTab === 'observaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('observaciones')}
            >
              💬 Observaciones
            </button>
            <button
              type="button"
              className={`stage-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
              onClick={() => setActiveTab('historial')}
            >
              ⏱ Historial de la etapa
            </button>
            {envelope && (
              <button
                type="button"
                className={`stage-tab-btn ${activeTab === 'docusign' ? 'active' : ''}`}
                onClick={() => setActiveTab('docusign')}
              >
                🔄 Firma electrónica (DocuSign)
              </button>
            )}
          </div>

          {/* TAB 1: Documentos */}
          {activeTab === 'documentos' && (
            <>
              {/* Progress and Top Action Buttons */}
              <div className="stage-progress-bar-row">
                <div className="stage-progress-info">
                  <span className="stage-progress-text">
                    {docsAprobadosCount} de {totalDocsCount} documentos aprobados
                  </span>
                  <div className="stage-progress-bar-container">
                    <div
                      className="stage-progress-bar-fill"
                      style={{ width: `${porcentajeAprobados}%` }}
                    />
                  </div>
                  <span className="stage-progress-percent">{porcentajeAprobados}%</span>
                </div>

                <div className="stage-top-actions">
                  <button
                    type="button"
                    className="stage-upload-primary-btn"
                    disabled={loading}
                    onClick={() => {
                      const firstPending = documentos.find(
                        (d) => d.estadoDocumento !== 'APROBADO' && d.estadoDocumento !== 'FIRMADO'
                      );
                      if (firstPending && fileInputRefs.current[firstPending.id]) {
                        fileInputRefs.current[firstPending.id]?.click();
                      } else {
                        onOpenSendDocumentsModal();
                      }
                    }}
                  >
                    <span>+</span> Cargar documento
                  </button>

                  <button
                    type="button"
                    className="doc-action-btn primary"
                    disabled={loading}
                    onClick={() => onOpenSendDocumentsModal()}
                    title="Enviar documentos para firma electrónica por correo"
                    style={{ fontWeight: 700 }}
                  >
                    ✉️ Enviar documentos
                  </button>

                  <button
                    type="button"
                    className="stage-menu-btn"
                    onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                    title="Más opciones"
                  >
                    ⋮
                  </button>
                </div>
              </div>

              {/* Modern Documents Table */}
              <div className="modern-docs-table-container">
                <table className="modern-docs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>Documento</th>
                      <th>Aplica a</th>
                      <th>Estado</th>
                      <th>Obligatorio</th>
                      <th>Fecha de carga</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((item, idx) => {
                      const isDocSigned = envelope?.estado === 'COMPLETED' || item.estadoDocumento === 'APROBADO' || item.estadoDocumento === 'FIRMADO';
                      const isDocDelivered = envelope?.estado === 'DELIVERED';
                      const isDocSent = envelope?.estado === 'SENT' || item.estadoDocumento === 'ENVIADO';
                      const isDocDeclined = envelope?.estado === 'DECLINED' || item.estadoDocumento === 'RECHAZADO';

                      return (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="doc-name-cell">
                              <span className="doc-name-title">{item.documento}</span>
                              {item.archivoNombre && (
                                <span className="doc-name-file">📎 {item.archivoNombre}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="doc-pill client">CLIENTE</span>
                          </td>
                          <td>
                            {isDocSigned ? (
                              <span className="doc-pill approved">✓ APROBADO</span>
                            ) : isDocDelivered ? (
                              <span className="doc-pill open">👁️ ABIERTO</span>
                            ) : isDocSent ? (
                              <span className="doc-pill sent">✉️ ENVIADO</span>
                            ) : isDocDeclined ? (
                              <span className="doc-pill declined">✕ RECHAZADO</span>
                            ) : (
                              <span className="doc-pill pending">⏱ PENDIENTE</span>
                            )}
                          </td>
                          <td>
                            <span className={`doc-pill ${item.obligatorio ? 'mandatory-yes' : 'mandatory-no'}`}>
                              {item.obligatorio ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td>
                            {item.archivoNombre ? (
                              credito.fechaRadicacion?.slice(0, 10) || '24/09/2026'
                            ) : (
                              '-'
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="doc-row-actions" style={{ justifyContent: 'flex-end', position: 'relative' }}>
                              {/* Hidden file input for direct upload */}
                              <input
                                type="file"
                                accept="application/pdf,image/png,image/jpeg"
                                style={{ display: 'none' }}
                                ref={(el) => {
                                  fileInputRefs.current[item.id] = el;
                                }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void onUploadDocumento(item.id, f);
                                  e.currentTarget.value = '';
                                }}
                              />

                              {!item.archivoNombre && !isDocSigned ? (
                                <>
                                  <button
                                    type="button"
                                    className="doc-action-btn"
                                    disabled={loading}
                                    title="Cargar archivo escaneado"
                                    onClick={() => fileInputRefs.current[item.id]?.click()}
                                  >
                                    📤 Cargar
                                  </button>
                                  <button
                                    type="button"
                                    className="doc-action-btn primary"
                                    disabled={loading}
                                    title="Enviar documento por correo para firma electrónica"
                                    onClick={() => onOpenSendDocumentsModal(item.documento)}
                                  >
                                    ✉️ Enviar
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="doc-action-btn"
                                  disabled={loading}
                                  onClick={() => onOpenDocumento(item.id)}
                                >
                                  👁 Ver
                                </button>
                              )}

                              {/* Row menu toggle */}
                              <button
                                type="button"
                                className="stage-menu-btn"
                                style={{ width: '30px', height: '30px' }}
                                onClick={() => setOpenDocMenuId(openDocMenuId === item.id ? null : item.id)}
                              >
                                ⋮
                              </button>

                              {/* Dropdown menu */}
                              {openDocMenuId === item.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    background: '#ffffff',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                                    zIndex: 30,
                                    minWidth: '180px',
                                    padding: '4px 0',
                                    textAlign: 'left'
                                  }}
                                >
                                  {!isDocSigned && (
                                    <button
                                      type="button"
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '7px 14px',
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '0.8rem',
                                        color: '#15803d',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontWeight: 600
                                      }}
                                      onClick={() => {
                                        setOpenDocMenuId(null);
                                        void onUpdateDocumentoEstado(item.id, 'APROBADO');
                                      }}
                                    >
                                      ✓ Aprobar documento
                                    </button>
                                  )}
                                  {!isDocDeclined && (
                                    <button
                                      type="button"
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '7px 14px',
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '0.8rem',
                                        color: '#b91c1c',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        fontWeight: 600
                                      }}
                                      onClick={() => {
                                        setOpenDocMenuId(null);
                                        void onUpdateDocumentoEstado(item.id, 'RECHAZADO');
                                      }}
                                    >
                                      ✕ Rechazar documento
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      padding: '7px 14px',
                                      border: 'none',
                                      background: 'none',
                                      fontSize: '0.8rem',
                                      color: '#0284c7',
                                      cursor: 'pointer',
                                      textAlign: 'left'
                                    }}
                                    onClick={() => {
                                      setOpenDocMenuId(null);
                                      onOpenSendDocumentsModal(item.documento);
                                    }}
                                  >
                                    ✉️ Enviar a firma electrónica
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Observación de la gestión box */}
              <div className="stage-observation-box">
                <label className="stage-observation-label">Observación de la gestión</label>
                <div className="stage-observation-textarea-wrap">
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Agrega una observación sobre la validación documental..."
                    value={observacionEtapa}
                    onChange={(e) => onChangeObservacionEtapa(e.target.value)}
                  />
                  <span className="stage-observation-counter">
                    {observacionEtapa.length}/500
                  </span>
                </div>
              </div>

              {/* Decision details if stage is Aprobación */}
              {isApprovalStage && creditoDecisionForm && onChangeDecisionForm && onDecideCredito && (
                <div style={{ margin: '0 1.5rem 1.5rem 1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                    Decisión de Aprobación
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    <input
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDecisionForm.montoAprobado}
                      onChange={(e) => onChangeDecisionForm((c) => ({ ...c, montoAprobado: e.target.value }))}
                      placeholder="Monto aprobado"
                    />
                    <select
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDecisionForm.plazoAprobado}
                      onChange={(e) => onChangeDecisionForm((c) => ({ ...c, plazoAprobado: e.target.value }))}
                    >
                      <option value="">Plazo aprobado</option>
                      {monthOptions.map((m) => <option key={m} value={m}>{m} meses</option>)}
                    </select>
                    <input
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDecisionForm.tasaAprobada}
                      onChange={(e) => onChangeDecisionForm((c) => ({ ...c, tasaAprobada: e.target.value }))}
                      placeholder="Tasa %"
                    />
                    <input
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDecisionForm.cuotaAprobada}
                      onChange={(e) => onChangeDecisionForm((c) => ({ ...c, cuotaAprobada: e.target.value }))}
                      placeholder="Cuota estimada"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="stage-btn-primary"
                      disabled={loading}
                      onClick={() => onDecideCredito('APROBADO')}
                    >
                      Registrar aprobación
                    </button>
                    <button
                      type="button"
                      className="stage-btn-outline"
                      disabled={loading}
                      onClick={() => onDecideCredito('DEVUELTO')}
                    >
                      Devolver
                    </button>
                    <button
                      type="button"
                      className="stage-btn-danger"
                      disabled={loading}
                      onClick={() => onDecideCredito('RECHAZADO')}
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              )}

              {/* Disbursement details if stage is Desembolso */}
              {isDisbursementStage && creditoDesembolsoForm && onChangeDesembolsoForm && onRegistrarDesembolso && (
                <div style={{ margin: '0 1.5rem 1.5rem 1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
                    Registro de Desembolso
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    <input
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDesembolsoForm.valorDesembolso}
                      onChange={(e) => onChangeDesembolsoForm((c: any) => ({ ...c, valorDesembolso: e.target.value }))}
                      placeholder="Valor desembolso"
                    />
                    <input
                      type="date"
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDesembolsoForm.fechaDesembolso}
                      onChange={(e) => onChangeDesembolsoForm((c: any) => ({ ...c, fechaDesembolso: e.target.value }))}
                    />
                    <select
                      style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDesembolsoForm.idInversion}
                      onChange={(e) => onChangeDesembolsoForm((c: any) => ({ ...c, idInversion: e.target.value }))}
                    >
                      <option value="">Socio / Inversión fondeo</option>
                      {fondeoDisponible.map((item) => (
                        <option key={item.idInversion} value={item.idInversion}>
                          {item.inversionista} - {formatMoney(item.saldoDisponible)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="stage-btn-primary"
                    disabled={loading}
                    onClick={onRegistrarDesembolso}
                  >
                    Registrar desembolso definitivo
                  </button>
                </div>
              )}

              {/* Bottom Sticky Action Bar */}
              <footer className="stage-footer-bar">
                <div className="stage-footer-info">
                  <span className="stage-footer-info-icon">ℹ</span>
                  <div className="stage-footer-info-text">
                    <strong>Para continuar, debes aprobar todos los documentos obligatorios.</strong>
                    <small>
                      {mandatoryPendingCount > 0
                        ? `Faltan ${mandatoryPendingCount} documentos obligatorios por validar.`
                        : 'Todos los documentos obligatorios han sido validados correctamente.'}
                    </small>
                  </div>
                </div>

                <div className="stage-footer-actions">
                  <button
                    type="button"
                    className="stage-btn-outline"
                    disabled={loading || !activeEtapa}
                    onClick={() => onUpdateEtapa('DEVUELTA')}
                  >
                    Devolver
                  </button>
                  <button
                    type="button"
                    className="stage-btn-danger"
                    disabled={loading || !activeEtapa}
                    onClick={() => onUpdateEtapa('RECHAZADA')}
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    className="stage-btn-primary"
                    disabled={loading || !activeEtapa || mandatoryPendingCount > 0}
                    onClick={() => onUpdateEtapa('APROBADA')}
                    title={
                      mandatoryPendingCount > 0
                        ? 'Aprueba los documentos obligatorios para avanzar'
                        : 'Aprobar etapa y avanzar al siguiente paso'
                    }
                  >
                    <span>✓</span> Aprobar etapa →
                  </button>
                </div>
              </footer>
            </>
          )}

          {/* TAB 2: Observaciones */}
          {activeTab === 'observaciones' && (
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Observaciones y Comentarios de la Gestión
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                {(expediente?.historial || []).length > 0 ? (
                  expediente?.historial.map((h) => (
                    <div key={h.id} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: '4px' }}>
                        <strong>{h.usuario || 'Sistema'}</strong>
                        <span>{formatDateTime(h.fecha)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: '#1e293b' }}>{h.observacion || h.accion}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#64748b', fontSize: '0.84rem' }}>No hay observaciones previas registradas.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Historial */}
          {activeTab === 'historial' && (
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
                Historial de Transiciones de la Etapa
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayEtapas.map((et, i) => (
                  <div key={et.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: et.estadoEtapa === 'APROBADA' ? '#10b981' : '#cbd5e1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                      {i + 1}
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a' }}>{et.etapa}</strong>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>({et.estadoEtapa})</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.76rem', color: '#64748b' }}>
                      {formatDateTime(et.fechaInicio) || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DocuSign State Machine */}
          {activeTab === 'docusign' && envelope && (
            <div style={{ padding: '1.5rem' }}>
              <DocuSignStateMachine
                envelope={envelope}
                token={token}
                onRefresh={async () => {
                  if (onReloadEnvelope) await onReloadEnvelope(envelope.envelopeId);
                  if (onReloadCredito) await onReloadCredito(credito.id);
                }}
                onClose={() => setActiveTab('documentos')}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Collapsible Accordion Widgets */}
        <aside className="credit-sidebar-column">
          {/* Accordion 1: Información del crédito */}
          <div className="accordion-card">
            <button
              type="button"
              className="accordion-header"
              onClick={() => setInfoAccordionOpen(!infoAccordionOpen)}
            >
              <div className="accordion-header-left">
                <span className="accordion-header-icon">🗂</span>
                <span>Información del crédito</span>
              </div>
              <span className={`accordion-header-chevron ${infoAccordionOpen ? '' : 'collapsed'}`}>
                ⌃
              </span>
            </button>

            {infoAccordionOpen && (
              <div className="accordion-content">
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">📋</span> Tipo de crédito
                  </span>
                  <span className="accordion-row-value">{credito.tipoCredito || credito.producto || 'Comercial'}</span>
                </div>
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">⏱</span> Plazo
                  </span>
                  <span className="accordion-row-value">{credito.plazo} meses</span>
                </div>
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">％</span> Tasa de interés
                  </span>
                  <span className="accordion-row-value">{credito.tasa ?? 1.5}% mensual</span>
                </div>
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">🛡</span> Embargos
                  </span>
                  <span className="accordion-row-value">
                    {expediente?.perfilCliente?.portal?.tieneEmbargos ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">✉</span> Correo confirmado
                  </span>
                  <span className="accordion-row-value">
                    {expediente?.perfilCliente?.portal?.correoConfirmado ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">📞</span> Teléfono
                  </span>
                  <span className="accordion-row-value">
                    {expediente?.perfilCliente?.portal?.telefono || credito.telefonoCliente || '3859765'}
                  </span>
                </div>
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">💵</span> Neto
                  </span>
                  <span className="accordion-row-value">
                    {formatMoney(expediente?.perfilCliente?.portal?.neto || credito.montoSolicitado)}
                  </span>
                </div>
                <div className="accordion-row">
                  <span className="accordion-row-label">
                    <span className="accordion-row-icon">👥</span> Representante
                  </span>
                  <span className="accordion-row-value" title={expediente?.perfilCliente?.empresa?.representanteLegal || credito.nombreCliente}>
                    {expediente?.perfilCliente?.empresa?.representanteLegal || credito.nombreCliente}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Liquidación definitiva */}
          <div className="accordion-card">
            <button
              type="button"
              className="accordion-header"
              onClick={() => setLiquidacionAccordionOpen(!liquidacionAccordionOpen)}
            >
              <div className="accordion-header-left">
                <span className="accordion-header-icon">📑</span>
                <span>Liquidación definitiva</span>
              </div>
              <span className={`accordion-header-chevron ${liquidacionAccordionOpen ? '' : 'collapsed'}`}>
                ⌃
              </span>
            </button>

            {liquidacionAccordionOpen && (
              <div className="accordion-content">
                {/* If liquidation doesn't exist yet and stage is before approval, show locked box */}
                {!liquidacionDefinitivaActual && (activeEtapa?.etapa?.toLowerCase().includes('document') || activeEtapa?.etapa?.toLowerCase().includes('radic')) ? (
                  <div className="accordion-locked-notice">
                    <span className="accordion-locked-icon">🔒</span>
                    <span>Disponible después de aprobar el estudio de crédito.</span>
                  </div>
                ) : (
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {liquidacionDefinitivaActual ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#64748b' }}>Monto solicitado:</span>
                          <strong>{formatMoney(liquidacionDefinitivaActual.montoSolicitado)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#64748b' }}>Cargos financiados:</span>
                          <strong>{formatMoney(liquidacionDefinitivaActual.cargosFinanciados)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#64748b' }}>Valor desembolso:</span>
                          <strong style={{ color: '#059669' }}>{formatMoney(liquidacionDefinitivaActual.valorDesembolso)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: '#64748b' }}>Cuota mensual:</span>
                          <strong>{formatMoney(liquidacionDefinitivaActual.cuota)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                          <span style={{ color: '#0f172a', fontWeight: 700 }}>Total a pagar:</span>
                          <strong style={{ color: '#0f172a' }}>{formatMoney(liquidacionDefinitivaActual.totalPagar)}</strong>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                        Sin liquidación definitiva registrada para esta versión.
                      </p>
                    )}

                    {onRegistrarLiquidacionDefinitiva && (
                      <button
                        type="button"
                        className="doc-action-btn primary"
                        style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                        onClick={onRegistrarLiquidacionDefinitiva}
                      >
                        {liquidacionDefinitivaActual ? 'Actualizar liquidación' : 'Registrar liquidación'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Historial Modal */}
      {showHistorialModal && (
        <div className="custom-modal-overlay" onClick={() => setShowHistorialModal(false)}>
          <div className="custom-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                Historial de Operaciones #{credito.consecutivo}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowHistorialModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {(expediente?.historial || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {expediente?.historial.map((item) => (
                    <div key={item.id} style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b' }}>
                        <strong>{item.accion}</strong>
                        <span>{formatDateTime(item.fecha)}</span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#1e293b' }}>
                        {item.observacion || 'Sin observación'}
                      </p>
                      <small style={{ color: '#94a3b8' }}>Usuario: {item.usuario || 'Sistema'}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.84rem' }}>No hay registros de historial aún.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="stage-btn-outline"
                onClick={() => setShowHistorialModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
