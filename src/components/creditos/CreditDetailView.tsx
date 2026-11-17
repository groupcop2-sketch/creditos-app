import React, { useState, useMemo, useRef, useEffect, useId } from 'react';
import type {
  CreditoRow,
  CreditoExpediente,
  CreditoDocumentoRow,
  CreditoEtapaRow,
  DocuSignEnvelopeDetail,
  FirmaCreditoRow,
  DocumentTemplateRow,
  FondeoDisponibleRow,
  EmployeeCatalogs
} from '../../api';
import { CreditHistoryDrawer } from './CreditHistoryDrawer';
import { EstudioCreditoPanel } from './EstudioCreditoPanel';
import { SoportesClientePanel } from './SoportesClientePanel';
import { RadicacionResumen } from './RadicacionResumen';
import { DesembolsoPanel } from './DesembolsoPanel';
import { VisacionPanel } from './VisacionPanel';
import { DocumentosAdicionalesPanel } from './DocumentosAdicionalesPanel';
import { DocuSignStateMachine } from '../docusign/DocuSignStateMachine';
import { Banknote, Building2, CalendarDays, Check, ChevronDown, ChevronRight, Download, MoreVertical, RefreshCw, ClipboardList, Clock3, FileText, History, Info, LockKeyhole, Mail, MessageSquare, Package, Percent, Phone, Search, ShieldCheck, UserRound, Users, Wallet } from 'lucide-react';

const ESTADO_ETAPA_LABEL: Record<string, string> = {
  APROBADA: 'Aprobada',
  EN_PROCESO: 'En proceso',
  PENDIENTE: 'Pendiente',
  DEVUELTA: 'Devuelta',
  RECHAZADA: 'Rechazada'
};

// The approval stage is shown as "Visación". shortcut: display-only rename; rename it in the stage catalog
// ("Flujo del crédito") once the backend that recognizes VISACION is deployed.
const etapaLabel = (nombre: string) => (/aprob/i.test(nombre.normalize('NFD').replace(/[̀-ͯ]/g, '')) ? 'Visación' : nombre);

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
    idCuentaEgreso: string;
    fechaConsignacion: string;
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
  /** Logged-in user's permissions; stages without their creditos:etapa-* permission are read-only. */
  permisos?: string[];
}

export const CreditDetailView: React.FC<CreditDetailViewProps> = ({
  permisos,
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
  const [summaryAccordionOpen, setSummaryAccordionOpen] = useState(true);
  const [liquidacionAccordionOpen, setLiquidacionAccordionOpen] = useState(true);
  const [docSearch, setDocSearch] = useState('');
  const [openDocMenuId, setOpenDocMenuId] = useState<number | null>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const actionsId = useId();
  const actionsTrigger = useRef<HTMLButtonElement>(null);
  const actionsMenu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (quickActionsOpen) actionsMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [quickActionsOpen]);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Active Stage
  const activeEtapa = useMemo(() => {
    return etapas.find((item) => item.id === selectedEtapaId) ?? etapas[0] ?? null;
  }, [etapas, selectedEtapaId]);

  // Stage kinds mirror the backend rules in creditos.service.ts (isClientDocsStage / isStudyStage / isApprovalStage).
  const stageKey = (activeEtapa?.etapa || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const isClientDocsStage = stageKey.includes('validacion') && stageKey.includes('document');
  const isStudyStage = !isClientDocsStage && (stageKey.includes('estudio') || stageKey.includes('analisis'));
  const isApprovalStage = stageKey.includes('aprob') || stageKey.includes('comite') || stageKey.includes('visacion');
  const isRadicacionStage = stageKey.includes('radic');
  // Stage permission (same mapping and order as permisos-etapa.ts in the backend).
  const permisoEtapa = isRadicacionStage ? 'creditos:etapa-radicacion'
    : isClientDocsStage ? 'creditos:etapa-validacion'
    : isStudyStage ? 'creditos:etapa-estudio'
    : isApprovalStage ? 'creditos:etapa-visacion'
    : stageKey.includes('desembols') ? 'creditos:etapa-desembolso'
    : null;
  const sinPermisoEtapa = Boolean(permisoEtapa && permisos && !permisos.includes(permisoEtapa));
  // A closed stage (approved or rejected), or one the user's role cannot work, is shown read-only.
  const etapaCerrada = activeEtapa?.estadoEtapa === 'APROBADA' || activeEtapa?.estadoEtapa === 'RECHAZADA';
  const readOnly = etapaCerrada || sinPermisoEtapa;
  const needsSigningDocs = !isClientDocsStage && (stageKey.includes('document') || stageKey.includes('soporte') || stageKey.includes('firma') || isApprovalStage);
  const [soportesPendientes, setSoportesPendientes] = useState(0);
  const [estudiosCount, setEstudiosCount] = useState(0);
  // Payroll loans: documents go to the client for signature only after the employer approved (Visación).
  const [firmaHabilitada, setFirmaHabilitada] = useState(true);
  useEffect(() => setFirmaHabilitada(true), [credito?.id]);
  const firmaBloqueada = isApprovalStage && !firmaHabilitada;
  const firmaBloqueadaTitle = 'Primero registra la aprobación de la empresa en Visación';

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

  // The backend rejects approving a stage while an earlier one is not approved.
  const etapaAnteriorPendiente = activeEtapa
    ? etapas.find((item) => item.orden < activeEtapa.orden && item.estadoEtapa !== 'APROBADA')
    : undefined;
  const approveBlocked = Boolean(etapaAnteriorPendiente) || (isClientDocsStage
    ? soportesPendientes > 0
    : isStudyStage
      ? estudiosCount === 0
      : needsSigningDocs && mandatoryPendingCount > 0);
  const approveBlockedTitle = etapaAnteriorPendiente
    ? `Primero aprueba la etapa "${etapaLabel(etapaAnteriorPendiente.etapa)}".`
    : isClientDocsStage
    ? 'Para continuar, aprueba todos los documentos que cargó el cliente.'
    : isStudyStage
      ? 'Para continuar, guarda el estudio de capacidad de pago.'
      : needsSigningDocs
        ? 'Para continuar, debes aprobar todos los documentos obligatorios.'
        : isRadicacionStage
          ? 'Revisa la solicitud, los datos del cliente y del empleador antes de aprobar.'
          : 'Revisa la información de la etapa antes de aprobarla.';
  const approveBlockedDetail = etapaAnteriorPendiente
    ? 'Las etapas se aprueban en orden. Selecciónala en la barra de arriba para gestionarla.'
    : isClientDocsStage
    ? soportesPendientes > 0 ? `Faltan ${soportesPendientes} documentos del cliente por aprobar.` : 'Todos los documentos del cliente están aprobados.'
    : isStudyStage
      ? estudiosCount === 0 ? 'Aún no hay un estudio guardado para este crédito.' : `Hay ${estudiosCount} estudio(s) guardado(s).`
      : needsSigningDocs
        ? mandatoryPendingCount > 0 ? `Faltan ${mandatoryPendingCount} documentos obligatorios por validar.` : 'Todos los documentos obligatorios han sido validados correctamente.'
        : 'Esta etapa no exige documentos para avanzar.';

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

  const getStageDescription = (etapaName?: string) => {
    const norm = (etapaName || '').toLowerCase();
    if (norm.includes('radic')) return 'Solicitud tal como la envió el cliente, con su información y la de su empleador.';
    if (norm.includes('document')) return 'Revisa y valida los documentos requeridos para continuar con el proceso de crédito.';
    if (norm.includes('estudio')) return 'Analiza la capacidad de pago, historial crediticio y endeudamiento del solicitante.';
    if (norm.includes('aprob') || norm.includes('visac')) return 'Visación: gestiona los documentos de firma, la carta a la empresa pagadora y la decisión del crédito.';
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
            Solicitado el {credito.fechaRadicacion ? formatDateTime(credito.fechaRadicacion) : '—'} · Por{' '}
            <strong>{credito.nombreCliente}</strong>
          </p>
        </div>

        <div className="credit-hero-actions">
          <div className="credit-current-stage"><small>Etapa seleccionada</small><strong><Clock3 size={12} />{activeEtapa ? etapaLabel(activeEtapa.etapa) : 'Sin etapa disponible'}</strong></div>
          <div className="credit-actions-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setQuickActionsOpen(false); }} onKeyDown={(event) => {
            if (event.key === 'Escape') { event.preventDefault(); setQuickActionsOpen(false); actionsTrigger.current?.focus(); }
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && quickActionsOpen) {
              event.preventDefault();
              const items = Array.from(actionsMenu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
              const current = items.indexOf(document.activeElement as HTMLButtonElement);
              const index = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
              items[index]?.focus();
            }
          }}>
            <button ref={actionsTrigger} type="button" className={`credit-action-btn-secondary credit-actions-trigger ${quickActionsOpen ? 'is-open' : ''}`} aria-haspopup="menu" aria-expanded={quickActionsOpen} aria-controls={actionsId} onClick={() => setQuickActionsOpen(!quickActionsOpen)}><MoreVertical size={16} />Acciones<ChevronDown size={15} /></button>
            {quickActionsOpen && <div className="credit-actions-menu" id={actionsId} role="menu" aria-label="Acciones del crédito" ref={actionsMenu}>
              <span className="credit-actions-menu-title">ACCIONES</span>
              <button type="button" role="menuitem" className="credit-actions-option featured" disabled={loading || firmaBloqueada} title={firmaBloqueada ? firmaBloqueadaTitle : undefined} onClick={() => { setQuickActionsOpen(false); onOpenSendDocumentsModal(); }}><span className="credit-actions-icon"><Mail size={22} /></span><span><strong>Enviar documentos al correo</strong><small>Se enviará un enlace seguro al cliente</small></span><ChevronRight size={17} /></button>
              <button type="button" role="menuitem" className="credit-actions-option" disabled={!envelope} onClick={() => { setQuickActionsOpen(false); setActiveTab('docusign'); }}><span className="credit-actions-icon"><RefreshCw size={21} /></span><span><strong>Trazabilidad DocuSign</strong><small>{envelope ? 'Consulta el estado de firma' : 'Disponible después del primer envío'}</small></span><ChevronRight size={17} /></button>
              {envelope?.estado === 'COMPLETED' && onDownloadSignedPdf && <button type="button" role="menuitem" className="credit-actions-option" disabled={loading} onClick={() => { setQuickActionsOpen(false); void onDownloadSignedPdf(envelope.envelopeId); }}><span className="credit-actions-icon"><Download size={21} /></span><span><strong>Descargar PDF firmado</strong><small>Obtén los documentos completados</small></span><ChevronRight size={17} /></button>}
              <div className="credit-actions-separator" />
              <button type="button" role="menuitem" className="credit-actions-option" onClick={() => { setQuickActionsOpen(false); setShowHistorialModal(true); }}><span className="credit-actions-icon"><History size={22} /></span><span><strong>Ver historial de acciones</strong><small>Registro de actividades</small></span><ChevronRight size={17} /></button>
            </div>}
          </div>
        </div>
      </section>

      {/* 4. HORIZONTAL CONNECTED STEPPER (PIPELINE) */}
      <section className="credit-stepper-card">
        <div className="credit-stepper">
          {displayEtapas.map((etapa, idx) => {
            const isCompleted = etapa.estadoEtapa === 'APROBADA';
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
                  title={`Ver etapa: ${etapaLabel(etapa.etapa)}`}
                >
                  <div className="stepper-circle">
                    {isCompleted ? <Check size={15} /> : etapa.orden || idx + 1}
                  </div>
                  <div className="stepper-labels">
                    <span className="stepper-title">{etapaLabel(etapa.etapa)}</span>
                    <span className="stepper-subtitle">
                      {ESTADO_ETAPA_LABEL[etapa.estadoEtapa] ?? 'Pendiente'}
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
        <div className="credit-detail-main-column">
          <section className="credit-applicant-card">
            <h2><Users size={16} />Información del solicitante</h2>
            <div className="credit-applicant-grid">
              <div className="credit-applicant-identity"><span className="credit-applicant-avatar"><UserRound size={23} /></span><div><strong>{credito.nombreCliente}</strong><small>{credito.identificacionCliente}</small><span className="credit-applicant-tag">CLIENTE</span></div></div>
              <div className="credit-applicant-contact"><span><Mail size={13} />{expediente?.perfilCliente?.portal?.correo || credito.correoCliente || '—'}</span><span><Phone size={13} />{expediente?.perfilCliente?.portal?.telefono || credito.telefonoCliente || '—'}</span></div>
              <div className="credit-applicant-company"><Building2 size={21} /><div><strong>{expediente?.perfilCliente?.empresa?.razonSocial || credito.empresa || 'Sin empresa asociada'}</strong><small>NIT {expediente?.perfilCliente?.empresa?.nit || '—'}</small></div></div>
              <div className="credit-applicant-dependents"><Users size={21} /><div><small>Personas a cargo</small><strong>{expediente?.perfilCliente?.empleado?.personasCargo ?? '—'}</strong><small>Vivienda: {expediente?.perfilCliente?.empleado?.tipoVivienda || '—'}</small></div></div>
            </div>
          </section>
        {/* LEFT COLUMN: Main Stage Card */}
        <div className="stage-main-card">
          {/* Stage Header */}
          <div className="stage-header">
            <div className="stage-header-left">
              <div className="stage-header-icon"><FileText size={20} /></div>
              <div className="stage-header-titles">
                <h2>{isApprovalStage && activeEtapa ? etapaLabel(activeEtapa.etapa) : activeTab === 'documentos' && needsSigningDocs ? 'Gestión documental' : activeEtapa ? etapaLabel(activeEtapa.etapa) : 'Gestión de la solicitud'}</h2>
                <p>{getStageDescription(activeEtapa?.etapa)}</p>
              </div>
            </div>

            <div className="stage-header-meta">
              <div className="stage-meta-item">
                <span className="stage-meta-label">Responsable</span>
                <span className="stage-meta-value">
                  {activeEtapa?.responsable || '—'}
                </span>
              </div>

              <div className="stage-meta-item">
                <span className="stage-meta-label">Inicio</span>
                <span className="stage-meta-value">
                  {activeEtapa?.fechaInicio ? formatDateTime(activeEtapa.fechaInicio) : '—'}
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
              <FileText size={14} /> Documentos ({documentos.length})
            </button>
            <button
              type="button"
              className={`stage-tab-btn ${activeTab === 'observaciones' ? 'active' : ''}`}
              onClick={() => setActiveTab('observaciones')}
            >
              <MessageSquare size={14} /> Observaciones
            </button>
            <button
              type="button"
              className={`stage-tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
              onClick={() => setActiveTab('historial')}
            >
              <History size={14} /> Historial de la etapa
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
              {isClientDocsStage && (
                <SoportesClientePanel token={token} creditoId={credito.id} readOnly={readOnly} formatMoney={formatMoney} onPendientesChange={(pendientes) => setSoportesPendientes(pendientes)} />
              )}
              {isStudyStage && (
                <EstudioCreditoPanel token={token} credito={credito} readOnly={readOnly} formatMoney={formatMoney} formatDateTime={formatDateTime} onEstudiosChange={setEstudiosCount} />
              )}
              {isRadicacionStage && (
                <RadicacionResumen token={token} credito={credito} expediente={expediente} formatMoney={formatMoney} formatDateTime={formatDateTime} />
              )}
              {needsSigningDocs && (<>
              {/* Progress and Top Action Buttons */}
              <div className="stage-progress-bar-row">
                <label className="credit-doc-search"><Search size={14} aria-hidden="true" /><input type="search" aria-label="Buscar documentos del crédito" placeholder="Buscar documento…" value={docSearch} onChange={(event) => setDocSearch(event.target.value)} /></label>
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

                {!readOnly && <div className="stage-top-actions">
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
                    disabled={loading || firmaBloqueada}
                    onClick={() => onOpenSendDocumentsModal()}
                    title={firmaBloqueada ? firmaBloqueadaTitle : 'Enviar documentos para firma electrónica por correo'}
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
                </div>}
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
                              {item.archivoNombre ? (
                                <span className="doc-name-file">
                                  📎 {item.archivoNombre}
                                  {item.archivoUrl?.startsWith('data:') && (
                                    <span style={{ marginLeft: '6px', fontSize: '10px', color: '#059669', background: '#ecfdf5', padding: '1px 5px', borderRadius: '4px' }}>Base64 Supabase</span>
                                  )}
                                  {item.archivoUrl && !item.archivoUrl.startsWith('data:') && (
                                    <span style={{ marginLeft: '6px', fontSize: '10px', color: '#ea580c', background: '#fff7ed', padding: '1px 5px', borderRadius: '4px' }}>AWS S3</span>
                                  )}
                                </span>
                              ) : item.archivoUrl ? (
                                <span className="doc-name-file">
                                  {item.archivoUrl.startsWith('data:') ? '⚡ Base64 en Supabase' : '☁️ Archivo en AWS S3'}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>
                            <span className="doc-pill client">{item.aplicaA || '—'}</span>
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
                            {item.archivoNombre || item.archivoUrl ? (
                              credito.fechaRadicacion?.slice(0, 10) || '—'
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

                              {!item.archivoNombre && !item.archivoUrl && !isDocSigned && readOnly ? (
                                <span className="soporte-sub">Sin archivo</span>
                              ) : !item.archivoNombre && !item.archivoUrl && !isDocSigned ? (
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
                              {!readOnly && <button
                                type="button"
                                className="stage-menu-btn"
                                style={{ width: '30px', height: '30px' }}
                                onClick={() => setOpenDocMenuId(openDocMenuId === item.id ? null : item.id)}
                              >
                                ⋮
                              </button>}

                              {/* Dropdown menu */}
                              {!readOnly && openDocMenuId === item.id && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)',
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
                                        color: 'var(--color-success)',
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
                                        color: 'var(--color-danger)',
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
                                      color: 'var(--color-info)',
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
              </>)}

              {isApprovalStage && (
                <VisacionPanel token={token} creditoId={credito.id} readOnly={readOnly} formatMoney={formatMoney} formatDateTime={formatDateTime} onFirmaHabilitadaChange={setFirmaHabilitada} />
              )}

              <DocumentosAdicionalesPanel token={token} creditoId={credito.id} readOnly={readOnly} formatDateTime={formatDateTime} />

              {/* Observación de la gestión box */}
              {!readOnly && <div className="stage-observation-box">
                <label className="stage-observation-label" htmlFor="stage-observacion">Observación de la gestión</label>
                <p className="stage-observation-hint">Para devolver o rechazar la etapa es obligatoria: se le envía al cliente por correo como motivo.</p>
                <div className="stage-observation-textarea-wrap">
                  <textarea
                    id="stage-observacion"
                    rows={2}
                    maxLength={500}
                    placeholder="Agrega una observación sobre esta etapa…"
                    value={observacionEtapa}
                    onChange={(e) => onChangeObservacionEtapa(e.target.value)}
                  />
                  <span className="stage-observation-counter">
                    {observacionEtapa.length}/500
                  </span>
                </div>
              </div>}

              {/* Decision details if stage is Aprobación */}
              {!readOnly && isApprovalStage && creditoDecisionForm && onChangeDecisionForm && onDecideCredito && (
                <div style={{ margin: '0 1.5rem 1.5rem 1.5rem', padding: '1.25rem', background: 'var(--bg-soft)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    Decisión del crédito
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
                    <input
                      style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDecisionForm.montoAprobado}
                      onChange={(e) => onChangeDecisionForm((c) => ({ ...c, montoAprobado: e.target.value }))}
                      placeholder="Monto aprobado"
                    />
                    <select
                      style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDecisionForm.plazoAprobado}
                      onChange={(e) => onChangeDecisionForm((c) => ({ ...c, plazoAprobado: e.target.value }))}
                    >
                      <option value="">Plazo aprobado</option>
                      {monthOptions.map((m) => <option key={m} value={m}>{m} meses</option>)}
                    </select>
                    <input
                      style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.82rem' }}
                      value={creditoDecisionForm.tasaAprobada}
                      onChange={(e) => onChangeDecisionForm((c) => ({ ...c, tasaAprobada: e.target.value }))}
                      placeholder="Tasa %"
                    />
                    <input
                      style={{ padding: '8px 12px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.82rem' }}
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

              {isDisbursementStage && credito && creditoDesembolsoForm && onChangeDesembolsoForm && onRegistrarDesembolso && (
                <DesembolsoPanel
                  token={token}
                  credito={credito}
                  liquidacion={expediente?.liquidacionDefinitiva ?? null}
                  desembolsos={expediente?.desembolsos ?? []}
                  form={creditoDesembolsoForm}
                  onChange={onChangeDesembolsoForm}
                  onSubmit={onRegistrarDesembolso}
                  fondeoDisponible={fondeoDisponible}
                  readOnly={readOnly}
                  loading={loading}
                  formatMoney={formatMoney}
                />
              )}

              {/* Bottom Sticky Action Bar */}

            </>
          )}

          {/* TAB 2: Observaciones */}
          {activeTab === 'observaciones' && (
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                Observaciones y Comentarios de la Gestión
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                {(expediente?.historial || []).length > 0 ? (
                  expediente?.historial.map((h) => (
                    <div key={h.id} style={{ padding: '12px 16px', background: 'var(--bg-soft)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <strong>{h.usuario || 'Sistema'}</strong>
                        <span>{formatDateTime(h.fecha)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{h.observacion || h.accion}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No hay observaciones previas registradas.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Historial */}
          {activeTab === 'historial' && (
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                Historial de Transiciones de la Etapa
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayEtapas.map((et, i) => (
                  <div key={et.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-soft)', borderRadius: '8px' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: et.estadoEtapa === 'APROBADA' ? '#10b981' : 'var(--border-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                      {i + 1}
                    </span>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>{etapaLabel(et.etapa)}</strong>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>({et.estadoEtapa})</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
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

        </div>
        {/* RIGHT COLUMN: Collapsible Accordion Widgets */}
        <aside className="credit-sidebar-column">
          <div className="accordion-card">
            <button type="button" className="accordion-header" aria-expanded={summaryAccordionOpen} onClick={() => setSummaryAccordionOpen(!summaryAccordionOpen)}><div className="accordion-header-left"><span className="accordion-header-icon"><Wallet size={16} /></span><span>Resumen del crédito</span></div><span className={`accordion-header-chevron ${summaryAccordionOpen ? '' : 'collapsed'}`}>⌃</span></button>
            {summaryAccordionOpen && <div className="accordion-content">
              <div className="accordion-row"><span className="accordion-row-label"><ClipboardList size={14} />Tipo de crédito</span><span className="accordion-row-value">{credito.tipoCredito || '—'}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><Package size={14} />Producto</span><span className="accordion-row-value">{credito.producto || '—'}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><Banknote size={14} />Monto solicitado</span><span className="accordion-row-value">{formatMoney(credito.montoSolicitado)}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><Wallet size={14} />Neto estimado</span><span className="accordion-row-value">{expediente?.perfilCliente?.portal?.neto != null ? formatMoney(expediente.perfilCliente.portal.neto) : '—'}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><CalendarDays size={14} />Plazo</span><span className="accordion-row-value">{credito.plazo} meses</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><Percent size={14} />Tasa de interés</span><span className="accordion-row-value">{credito.tasa != null ? credito.tasa + '%' : '—'}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><Banknote size={14} />Cuota estimada</span><span className="accordion-row-value">{credito.cuotaEstimada != null ? formatMoney(credito.cuotaEstimada) : '—'}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><ShieldCheck size={14} />Embargos</span><span className="accordion-row-value">{expediente?.perfilCliente?.portal ? (expediente.perfilCliente.portal.tieneEmbargos ? 'Sí' : 'No') : '—'}</span></div>
            </div>}
          </div>
          <div className="accordion-card">
            <button type="button" className="accordion-header" aria-expanded={infoAccordionOpen} onClick={() => setInfoAccordionOpen(!infoAccordionOpen)}><div className="accordion-header-left"><span className="accordion-header-icon"><Info size={16} /></span><span>Información adicional</span></div><span className={`accordion-header-chevron ${infoAccordionOpen ? '' : 'collapsed'}`}>⌃</span></button>
            {infoAccordionOpen && <div className="accordion-content">
              <div className="accordion-row"><span className="accordion-row-label"><Mail size={14} />Correo confirmado</span><span className="accordion-row-value">{expediente?.perfilCliente?.portal ? (expediente.perfilCliente.portal.correoConfirmado ? 'Sí' : 'No') : '—'}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><Phone size={14} />Teléfono</span><span className="accordion-row-value">{expediente?.perfilCliente?.portal?.telefono || credito.telefonoCliente || '—'}</span></div>
              <div className="accordion-row"><span className="accordion-row-label"><Users size={14} />Representante</span><span className="accordion-row-value">{expediente?.perfilCliente?.empresa?.representanteLegal || '—'}</span></div>
            </div>}
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
                    <span className="accordion-locked-icon"><LockKeyhole size={18} /></span>
                    <span>Disponible después de aprobar el estudio de crédito.</span>
                  </div>
                ) : (
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {liquidacionDefinitivaActual ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Monto solicitado:</span>
                          <strong>{formatMoney(liquidacionDefinitivaActual.montoSolicitado)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cargos financiados:</span>
                          <strong>{formatMoney(liquidacionDefinitivaActual.cargosFinanciados)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Valor desembolso:</span>
                          <strong style={{ color: 'var(--color-success)' }}>{formatMoney(liquidacionDefinitivaActual.valorDesembolso)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Cuota mensual:</span>
                          <strong>{formatMoney(liquidacionDefinitivaActual.cuota)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Total a pagar:</span>
                          <strong style={{ color: 'var(--text-main)' }}>{formatMoney(liquidacionDefinitivaActual.totalPagar)}</strong>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
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
      {activeTab === 'documentos' && (
              <footer className="stage-footer-bar">
                <div className="stage-footer-info">
                  <span className="stage-footer-info-icon">ℹ</span>
                  <div className="stage-footer-info-text">
                    {sinPermisoEtapa && !etapaCerrada ? (
                      <>
                        <strong>Tu rol no tiene permiso para trabajar la etapa {activeEtapa ? etapaLabel(activeEtapa.etapa) : ''}.</strong>
                        <small>Solo consulta. Un administrador puede asignarlo en Seguridad → Roles.</small>
                      </>
                    ) : readOnly ? (
                      <>
                        <strong>Etapa {activeEtapa?.estadoEtapa === 'APROBADA' ? 'aprobada' : 'rechazada'}{activeEtapa?.fechaFin ? ` el ${formatDateTime(activeEtapa.fechaFin)}` : ''}.</strong>
                        <small>Solo lectura: la información de esta etapa ya no se puede modificar.</small>
                      </>
                    ) : (
                      <>
                        <strong>{approveBlockedTitle}</strong>
                        <small>{approveBlockedDetail}</small>
                      </>
                    )}
                  </div>
                </div>

                {!readOnly && <div className="stage-footer-actions">
                  <button
                    type="button"
                    className="stage-btn-outline"
                    disabled={loading || !activeEtapa || !observacionEtapa.trim()}
                    title={observacionEtapa.trim() ? 'Devuelve la etapa y envía el motivo al cliente por correo' : 'Escribe el motivo en la observación'}
                    onClick={() => onUpdateEtapa('DEVUELTA')}
                  >
                    Devolver
                  </button>
                  <button
                    type="button"
                    className="stage-btn-danger"
                    disabled={loading || !activeEtapa || !observacionEtapa.trim()}
                    title={observacionEtapa.trim() ? 'Rechaza la etapa y envía el motivo al cliente por correo' : 'Escribe el motivo en la observación'}
                    onClick={() => onUpdateEtapa('RECHAZADA')}
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    className="stage-btn-primary"
                    disabled={loading || !activeEtapa || approveBlocked}
                    onClick={() => onUpdateEtapa('APROBADA')}
                    title={approveBlocked ? approveBlockedDetail : 'Aprobar etapa y avanzar al siguiente paso'}
                  >
                    <span>✓</span> Aprobar etapa →
                  </button>
                </div>}
              </footer>
      )}


      {showHistorialModal && <CreditHistoryDrawer credito={credito} records={expediente?.historial ?? []} onClose={() => setShowHistorialModal(false)} />}
    </div>
  );
};
