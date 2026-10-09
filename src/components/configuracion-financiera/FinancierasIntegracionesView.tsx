import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plug,
  ShieldCheck,
  FileCheck2,
  Plus,
  Pencil,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  Layers,
  ArrowRight,
  Info,
  Server
} from 'lucide-react';
import {
  api,
  type FinancieraRow,
  type IntegracionRow,
  type IntegracionFinancieraRow
} from '../../api';

interface Props {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const FinancierasIntegracionesView: React.FC<Props> = ({ token, notify }) => {
  const [activeTab, setActiveTab] = useState<'financieras' | 'integraciones' | 'catalogo'>('financieras');
  const [loading, setLoading] = useState(false);

  // Financieras State
  const [financieras, setFinancieras] = useState<FinancieraRow[]>([]);
  const [searchFinanciera, setSearchFinanciera] = useState('');
  const [selectedFinancieraId, setSelectedFinancieraId] = useState<number | null>(null);

  // Modal Financiera
  const [modalFinancieraOpen, setModalFinancieraOpen] = useState(false);
  const [editingFinanciera, setEditingFinanciera] = useState<FinancieraRow | null>(null);
  const [financieraForm, setFinancieraForm] = useState({
    nit: '',
    razonSocial: '',
    sigla: '',
    correo: '',
    telefono: '',
    direccion: '',
    sitioWeb: '',
    indActivo: true
  });
  const [savingFinanciera, setSavingFinanciera] = useState(false);

  // Integraciones State
  const [catalogoIntegraciones, setCatalogoIntegraciones] = useState<IntegracionRow[]>([]);
  const [integracionesFinanciera, setIntegracionesFinanciera] = useState<IntegracionFinancieraRow[]>([]);
  const [loadingIntegraciones, setLoadingIntegraciones] = useState(false);

  // Password visibility
  const [showSecretMap, setShowSecretMap] = useState<Record<number, boolean>>({});

  // Active integration edit state
  const [integracionForms, setIntegracionForms] = useState<Record<number, Partial<IntegracionFinancieraRow>>>({});
  const [savingIntegracionId, setSavingIntegracionId] = useState<number | null>(null);

  // Modal Catalogo
  const [modalCatalogoOpen, setModalCatalogoOpen] = useState(false);
  const [catalogoForm, setCatalogoForm] = useState({
    codigo: '',
    nombre: '',
    tipo: 'BIOMETRIA',
    descripcion: '',
    urlBase: ''
  });
  const [savingCatalogo, setSavingCatalogo] = useState(false);

  // Load Financieras
  const loadFinancieras = async () => {
    setLoading(true);
    try {
      const data = await api.listFinancieras(token);
      setFinancieras(data);
      if (data.length > 0 && !selectedFinancieraId) {
        setSelectedFinancieraId(data[0].id_financiera);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar financieras';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load Catalogo
  const loadCatalogo = async () => {
    try {
      const data = await api.listIntegracionesCatalogo(token);
      setCatalogoIntegraciones(data);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  // Load Integraciones for selected Financiera
  const loadIntegracionesFinanciera = async (idFinanciera: number) => {
    setLoadingIntegraciones(true);
    try {
      const data = await api.listIntegracionesFinanciera(token, idFinanciera);
      setIntegracionesFinanciera(data);

      // Populate forms
      const forms: Record<number, Partial<IntegracionFinancieraRow>> = {};
      data.forEach((row) => {
        forms[row.id_integracion] = { ...row };
      });
      setIntegracionForms(forms);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar integraciones de la financiera';
      notify(msg, 'error');
    } finally {
      setLoadingIntegraciones(false);
    }
  };

  useEffect(() => {
    loadFinancieras();
    loadCatalogo();
  }, []);

  useEffect(() => {
    if (selectedFinancieraId) {
      loadIntegracionesFinanciera(selectedFinancieraId);
    }
  }, [selectedFinancieraId]);

  // Filtered Financieras
  const filteredFinancieras = useMemo(() => {
    if (!searchFinanciera.trim()) return financieras;
    const q = searchFinanciera.toLowerCase();
    return financieras.filter(
      (f) =>
        f.v_razon_social.toLowerCase().includes(q) ||
        f.v_nit.toLowerCase().includes(q) ||
        (f.v_sigla && f.v_sigla.toLowerCase().includes(q))
    );
  }, [financieras, searchFinanciera]);

  // Handle open modal financiera
  const handleOpenCreateFinanciera = () => {
    setEditingFinanciera(null);
    setFinancieraForm({
      nit: '',
      razonSocial: '',
      sigla: '',
      correo: '',
      telefono: '',
      direccion: '',
      sitioWeb: '',
      indActivo: true
    });
    setModalFinancieraOpen(true);
  };

  const handleOpenEditFinanciera = (f: FinancieraRow) => {
    setEditingFinanciera(f);
    setFinancieraForm({
      nit: f.v_nit,
      razonSocial: f.v_razon_social,
      sigla: f.v_sigla || '',
      correo: f.v_correo || '',
      telefono: f.v_telefono || '',
      direccion: f.v_direccion || '',
      sitioWeb: f.v_sitio_web || '',
      indActivo: f.ind_activo
    });
    setModalFinancieraOpen(true);
  };

  const handleSaveFinanciera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financieraForm.nit.trim() || !financieraForm.razonSocial.trim()) {
      notify('NIT y Razón Social son obligatorios', 'warning');
      return;
    }
    setSavingFinanciera(true);
    try {
      if (editingFinanciera) {
        await api.updateFinanciera(token, editingFinanciera.id_financiera, financieraForm);
        notify('Financiera actualizada exitosamente', 'success');
      } else {
        await api.createFinanciera(token, financieraForm);
        notify('Financiera creada exitosamente', 'success');
      }
      setModalFinancieraOpen(false);
      loadFinancieras();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar financiera';
      notify(msg, 'error');
    } finally {
      setSavingFinanciera(false);
    }
  };

  // Toggle integracion
  const handleToggleIntegracion = async (idIntegracion: number, currentActive: boolean) => {
    if (!selectedFinancieraId) return;
    try {
      const nextActive = !currentActive;
      await api.toggleIntegracionFinanciera(token, selectedFinancieraId, idIntegracion, nextActive);
      notify(
        nextActive
          ? 'Integración activada. Los clientes de esta financiera usarán el servicio automático.'
          : 'Integración desactivada. Los clientes de esta financiera harán carga manual de fotos y documentos.',
        'info'
      );
      loadIntegracionesFinanciera(selectedFinancieraId);
      loadFinancieras();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado';
      notify(msg, 'error');
    }
  };

  // Save integration config
  const handleSaveIntegracion = async (idIntegracion: number) => {
    if (!selectedFinancieraId) return;
    const form = integracionForms[idIntegracion] || {};
    setSavingIntegracionId(idIntegracion);
    try {
      await api.upsertIntegracionFinanciera(token, selectedFinancieraId, {
        idIntegracion,
        ambiente: form.ambiente || 'sandbox',
        clientId: form.client_id || '',
        clientSecret: form.client_secret || '',
        accountId: form.account_id || '',
        apiKey: form.api_key || '',
        urlBase: form.url_base || '',
        webhookUrl: form.webhook_url || '',
        indActivo: form.ind_activo ?? false,
        indModoPrueba: form.ind_modo_prueba ?? true
      });
      notify('Configuración de integración guardada exitosamente', 'success');
      loadIntegracionesFinanciera(selectedFinancieraId);
      loadFinancieras();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar integración';
      notify(msg, 'error');
    } finally {
      setSavingIntegracionId(null);
    }
  };

  // Save new integration provider in catalog
  const handleSaveCatalogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogoForm.codigo.trim() || !catalogoForm.nombre.trim()) {
      notify('Código y Nombre son obligatorios', 'warning');
      return;
    }
    setSavingCatalogo(true);
    try {
      await api.createIntegracionCatalogo(token, catalogoForm);
      notify('Proveedor de integración añadido al catálogo', 'success');
      setModalCatalogoOpen(false);
      loadCatalogo();
      if (selectedFinancieraId) {
        loadIntegracionesFinanciera(selectedFinancieraId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al añadir al catálogo';
      notify(msg, 'error');
    } finally {
      setSavingCatalogo(false);
    }
  };

  const selectedFinanciera = financieras.find((f) => f.id_financiera === selectedFinancieraId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '16px',
          padding: '24px 28px',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
            }}
          >
            <Building2 size={28} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Financieras & Integraciones
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Gestión multi-entidad de libranceras y parametrización de biometría (Jumio) y firma digital (DocuSign)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadFinancieras}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refrescar
          </button>
          <button
            type="button"
            onClick={handleOpenCreateFinanciera}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#2563eb',
              border: 'none',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Plus size={16} /> Nueva Financiera
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '2px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('financieras')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'financieras' ? 600 : 500,
            color: activeTab === 'financieras' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'financieras' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Building2 size={16} />
          Financieras / Libranceras ({financieras.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('integraciones')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'integraciones' ? 600 : 500,
            color: activeTab === 'integraciones' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'integraciones' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Plug size={16} />
          Integraciones por Financiera
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalogo')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: activeTab === 'catalogo' ? 600 : 500,
            color: activeTab === 'catalogo' ? '#2563eb' : '#64748b',
            borderBottom: activeTab === 'catalogo' ? '2px solid #2563eb' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} />
          Catálogo de Servicios API
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LISTADO DE FINANCIERAS */}
      {/* ============================================================== */}
      {activeTab === 'financieras' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ position: 'relative', width: '320px' }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Buscar por NIT, Razón Social, Sigla..."
                value={searchFinanciera}
                onChange={(e) => setSearchFinanciera(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              Mostrando {filteredFinancieras.length} de {financieras.length} entidades
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Entidad Financiera</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>NIT / Identificación</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Contacto</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Integraciones Activas</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      Cargando entidades financieras...
                    </td>
                  </tr>
                ) : filteredFinancieras.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      No se encontraron entidades financieras registradas.
                    </td>
                  </tr>
                ) : (
                  filteredFinancieras.map((f) => (
                    <tr
                      key={f.id_financiera}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          >
                            {f.v_sigla ? f.v_sigla.slice(0, 3) : f.v_razon_social.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{f.v_razon_social}</div>
                            {f.v_sigla && <div style={{ fontSize: '12px', color: '#64748b' }}>{f.v_sigla}</div>}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 500 }}>
                        {f.v_nit}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {f.v_correo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
                            <Mail size={12} /> {f.v_correo}
                          </div>
                        )}
                        {f.v_telefono && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                            <Phone size={12} /> {f.v_telefono}
                          </div>
                        )}
                        {!f.v_correo && !f.v_telefono && <span style={{ color: '#cbd5e1' }}>Sin contacto</span>}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {f.integraciones_activas && f.integraciones_activas.length > 0 ? (
                            f.integraciones_activas.map((code) => (
                              <span
                                key={code}
                                style={{
                                  background: code === 'JUMIO' ? '#eff6ff' : code === 'DIDIT' ? '#f5f3ff' : '#ecfdf5',
                                  color: code === 'JUMIO' ? '#1d4ed8' : code === 'DIDIT' ? '#6d28d9' : '#047857',
                                  border: `1px solid ${code === 'JUMIO' ? '#bfdbfe' : code === 'DIDIT' ? '#ddd6fe' : '#a7f3d0'}`,
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                {code}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Carga manual (sin integraciones activas)
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: f.ind_activo ? '#ecfdf5' : '#fef2f2',
                            color: f.ind_activo ? '#059669' : '#dc2626',
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}
                        >
                          {f.ind_activo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {f.ind_activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFinancieraId(f.id_financiera);
                              setActiveTab('integraciones');
                            }}
                            title="Configurar Integraciones (Jumio, DocuSign)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            <Plug size={13} /> Integraciones
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditFinanciera(f)}
                            title="Editar Datos"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              background: '#f1f5f9',
                              color: '#475569',
                              border: 'none',
                              padding: '5px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: INTEGRACIONES POR FINANCIERA */}
      {/* ============================================================== */}
      {activeTab === 'integraciones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Financiera Selector Bar */}
          <div
            style={{
              background: '#ffffff',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Financiera seleccionada:
              </label>
              <select
                value={selectedFinancieraId || ''}
                onChange={(e) => setSelectedFinancieraId(Number(e.target.value))}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  minWidth: '280px'
                }}
              >
                {financieras.map((f) => (
                  <option key={f.id_financiera} value={f.id_financiera}>
                    {f.v_razon_social} (NIT: {f.v_nit})
                  </option>
                ))}
              </select>
            </div>

            {selectedFinanciera && (
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                NIT: <strong>{selectedFinanciera.v_nit}</strong> | Estado:{' '}
                <strong style={{ color: selectedFinanciera.ind_activo ? '#059669' : '#dc2626' }}>
                  {selectedFinanciera.ind_activo ? 'Activa' : 'Inactiva'}
                </strong>
              </div>
            )}
          </div>

          {/* Info callout */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <Info size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '13px', color: '#0369a1', lineHeight: '1.5' }}>
              <strong>Regla de Negocio Dinámica:</strong> Cada financiera tiene su propio switch y credenciales de
              conexión para <strong>Jumio</strong>, <strong>Didit KYC</strong> y <strong>DocuSign</strong>. Si los switches de biometría
              están apagados o las credenciales no están configuradas, el portal de clientes activará automáticamente la{' '}
              <strong>carga manual de documentos y foto selfie</strong> para las solicitudes de crédito asignadas a esta
              entidad.
            </div>
          </div>

          {/* Integrations Cards Grid */}
          {loadingIntegraciones ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Cargando parámetros de integraciones...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
              {catalogoIntegraciones.map((cat) => {
                const integracionRow = integracionesFinanciera.find((r) => r.id_integracion === cat.id_integracion);
                const form = integracionForms[cat.id_integracion] || {};
                const isJumio = cat.codigo === 'JUMIO';
                const isDocuSign = cat.codigo === 'DOCUSIGN';
                const isDidit = cat.codigo === 'DIDIT';
                const isActive = form.ind_activo ?? false;
                const showSecret = showSecretMap[cat.id_integracion] || false;
                const isSaving = savingIntegracionId === cat.id_integracion;

                return (
                  <div
                    key={cat.id_integracion}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: `1px solid ${isActive ? (isDidit ? '#c4b5fd' : '#93c5fd') : '#e2e8f0'}`,
                      boxShadow: isActive
                        ? isDidit
                          ? '0 4px 20px rgba(124, 58, 237, 0.1)'
                          : '0 4px 20px rgba(37, 99, 235, 0.08)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Card Header */}
                    <div
                      style={{
                        padding: '18px 22px',
                        borderBottom: '1px solid #f1f5f9',
                        background: isActive ? '#f8fafc' : '#fafafa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            background: isJumio
                              ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
                              : isDocuSign
                              ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                              : isDidit
                              ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                              : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                          }}
                        >
                          {isJumio ? <ShieldCheck size={22} /> : isDocuSign ? <FileCheck2 size={22} /> : isDidit ? <ShieldCheck size={22} /> : <Plug size={22} />}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                              {cat.nombre}
                            </h3>
                            <span
                              style={{
                                background: isDidit ? '#f5f3ff' : '#f1f5f9',
                                color: isDidit ? '#7c3aed' : '#475569',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 700
                              }}
                            >
                              {cat.tipo}
                            </span>
                          </div>
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                            {cat.descripcion || 'Servicio de integración API'}
                          </p>
                        </div>
                      </div>

                      {/* Active Toggle Switch */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: isActive ? '#059669' : '#94a3b8' }}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleIntegracion(cat.id_integracion, isActive)}
                          style={{
                            width: '44px',
                            height: '24px',
                            borderRadius: '999px',
                            background: isActive ? '#059669' : '#cbd5e1',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            padding: '2px'
                          }}
                        >
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#ffffff',
                              transform: isActive ? 'translateX(20px)' : 'translateX(0)',
                              transition: 'transform 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                      {/* Status summary */}
                      <div
                        style={{
                          background: isActive ? (isDidit ? '#faf5ff' : '#eff6ff') : '#f8fafc',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: isActive ? (isDidit ? '#7c3aed' : '#2563eb') : '#94a3b8'
                            }}
                          />
                          <span style={{ fontWeight: 600, color: '#334155' }}>
                            {isActive
                              ? `Enrutamiento automático a ${cat.nombre}`
                              : isJumio || isDidit
                              ? 'Modo fallback: Carga manual de documentos'
                              : 'Servicio deshabilitado'}
                          </span>
                        </div>
                        <span style={{ color: '#64748b' }}>
                          Ambiente: <strong>{(form.ambiente || 'sandbox').toUpperCase()}</strong>
                        </span>
                      </div>

                      {/* Fields */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                            Ambiente de Ejecución
                          </label>
                          <select
                            value={form.ambiente || 'sandbox'}
                            onChange={(e) =>
                              setIntegracionForms({
                                ...integracionForms,
                                [cat.id_integracion]: { ...form, ambiente: e.target.value }
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              background: '#ffffff'
                            }}
                          >
                            <option value="sandbox">Sandbox / Demo / Pruebas</option>
                            <option value="production">Producción</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                            Modo Simulado / Test
                          </label>
                          <select
                            value={form.ind_modo_prueba ? 'true' : 'false'}
                            onChange={(e) =>
                              setIntegracionForms({
                                ...integracionForms,
                                [cat.id_integracion]: { ...form, ind_modo_prueba: e.target.value === 'true' }
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              background: '#ffffff'
                            }}
                          >
                            <option value="true">Sí (Simulación con feedback)</option>
                            <option value="false">No (Llamada Real a API)</option>
                          </select>
                        </div>
                      </div>

                      {/* Client ID / Workflow ID */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          {isJumio ? 'API Token / Client ID' : isDocuSign ? 'Integration Key (Client ID)' : isDidit ? 'Didit Workflow ID (UUID)' : 'Client ID'}
                        </label>
                        <input
                          type="text"
                          placeholder={isJumio ? 'Ej: 9b1deb4d-3b7d-4bad-9bdd-...' : isDocuSign ? 'Ej: 7a68e8c8-...' : isDidit ? 'Ej: e42a2607-2f9f-475e-a5b8-0cbfc0213b06' : 'Client ID'}
                          value={form.client_id || ''}
                          onChange={(e) =>
                            setIntegracionForms({
                              ...integracionForms,
                              [cat.id_integracion]: { ...form, client_id: e.target.value }
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>

                      {/* Didit Dedicated API Key */}
                      {isDidit && (
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                            Didit API Key (x-api-key)
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showSecret ? 'text' : 'password'}
                              placeholder="Ej: ddt_sec_..."
                              value={form.api_key || ''}
                              onChange={(e) =>
                                setIntegracionForms({
                                  ...integracionForms,
                                  [cat.id_integracion]: { ...form, api_key: e.target.value }
                                })
                              }
                              style={{
                                width: '100%',
                                padding: '8px 36px 8px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '12px',
                                fontFamily: 'monospace'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecretMap({
                                  ...showSecretMap,
                                  [cat.id_integracion]: !showSecret
                                })
                              }
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                            >
                              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Client Secret / Webhook Secret */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          {isJumio ? 'API Secret / Key' : isDocuSign ? 'Secret Key (HMAC / RSA)' : isDidit ? 'Webhook Secret (HMAC SHA-256)' : 'Client Secret'}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showSecret ? 'text' : 'password'}
                            placeholder={isDidit ? 'Secreto de firma X-Signature-V2' : '••••••••••••••••••••••••••••••••'}
                            value={form.client_secret || ''}
                            onChange={(e) =>
                              setIntegracionForms({
                                ...integracionForms,
                                [cat.id_integracion]: { ...form, client_secret: e.target.value }
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '8px 36px 8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecretMap({
                                ...showSecretMap,
                                [cat.id_integracion]: !showSecret
                              })
                            }
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Account ID / Extra param if DocuSign */}
                      {isDocuSign && (
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                            DocuSign Account ID (API GUID)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: f47ac10b-58cc-4372-a567-0e02b2c3d479"
                            value={form.account_id || ''}
                            onChange={(e) =>
                              setIntegracionForms({
                                ...integracionForms,
                                [cat.id_integracion]: { ...form, account_id: e.target.value }
                              })
                            }
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>
                      )}

                      {/* Base URL / Datacenter */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          URL Base Endpoint
                        </label>
                        <input
                          type="text"
                          placeholder={cat.url_base || (isDidit ? 'https://verification.didit.me/v3' : 'https://api.servicio.com')}
                          value={form.url_base || ''}
                          onChange={(e) =>
                            setIntegracionForms({
                              ...integracionForms,
                              [cat.id_integracion]: { ...form, url_base: e.target.value }
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px'
                          }}
                        />
                      </div>

                      {/* Webhook URL */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          URL de Notificación Webhook
                        </label>
                        <input
                          type="text"
                          placeholder={isDidit ? 'https://ms-creditos-app-weld.vercel.app/api/v1/portal/didit/webhook' : 'https://ms-creditos-app-weld.vercel.app/api/v1/...'}
                          value={form.webhook_url || ''}
                          onChange={(e) =>
                            setIntegracionForms({
                              ...integracionForms,
                              [cat.id_integracion]: { ...form, webhook_url: e.target.value }
                            })
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div
                      style={{
                        padding: '14px 22px',
                        background: '#f8fafc',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {integracionRow
                          ? `Registrado en DB (${new Date(integracionRow.id_integracion_financiera ? Date.now() : 0).toLocaleDateString()})`
                          : 'Pendiente por guardar'}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveIntegracion(cat.id_integracion)}
                        disabled={isSaving}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          padding: '7px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: isSaving ? 0.7 : 1
                        }}
                      >
                        <Save size={14} /> {isSaving ? 'Guardando...' : 'Guardar Parámetros'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CATÁLOGO DE INTEGRACIONES */}
      {/* ============================================================== */}
      {activeTab === 'catalogo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Catálogo maestro de proveedores y APIs integradas en la plataforma de créditos.
            </p>
            <button
              type="button"
              onClick={() => {
                setCatalogoForm({
                  codigo: '',
                  nombre: '',
                  tipo: 'BIOMETRIA',
                  descripcion: '',
                  urlBase: ''
                });
                setModalCatalogoOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} /> Registrar Proveedor API
            </button>
          </div>

          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Código</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Proveedor / Nombre</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tipo Servicio</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>URL Base Predeterminada</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Descripción</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {catalogoIntegraciones.map((cat) => (
                  <tr key={cat.id_integracion} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                      {cat.codigo}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                      {cat.nombre}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#475569'
                        }}
                      >
                        {cat.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {cat.url_base || 'No especificada'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {cat.descripcion || 'Sin descripción'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: cat.ind_activo ? '#059669' : '#dc2626',
                          fontWeight: 600,
                          fontSize: '12px'
                        }}
                      >
                        {cat.ind_activo ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {cat.ind_activo ? 'Disponible' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREAR / EDITAR FINANCIERA */}
      {/* ============================================================== */}
      {modalFinancieraOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={20} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  {editingFinanciera ? 'Editar Entidad Financiera' : 'Nueva Entidad Financiera / Librancera'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalFinancieraOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFinanciera} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    NIT *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 901888001-1"
                    value={financieraForm.nit}
                    onChange={(e) => setFinancieraForm({ ...financieraForm, nit: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: P&S SOLUCIONES FINANCIERAS SAS"
                    value={financieraForm.razonSocial}
                    onChange={(e) => setFinancieraForm({ ...financieraForm, razonSocial: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Sigla / Nombre Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: P&S"
                    value={financieraForm.sigla}
                    onChange={(e) => setFinancieraForm({ ...financieraForm, sigla: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: (601) 321 0000"
                    value={financieraForm.telefono}
                    onChange={(e) => setFinancieraForm({ ...financieraForm, telefono: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Correo de Contacto
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@financiera.com"
                    value={financieraForm.correo}
                    onChange={(e) => setFinancieraForm({ ...financieraForm, correo: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Sitio Web
                  </label>
                  <input
                    type="text"
                    placeholder="https://www.financiera.com"
                    value={financieraForm.sitioWeb}
                    onChange={(e) => setFinancieraForm({ ...financieraForm, sitioWeb: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Calle 100 # 15-20, Bogotá"
                  value={financieraForm.direccion}
                  onChange={(e) => setFinancieraForm({ ...financieraForm, direccion: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="chk-financiera-activo"
                  checked={financieraForm.indActivo}
                  onChange={(e) => setFinancieraForm({ ...financieraForm, indActivo: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="chk-financiera-activo" style={{ fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                  Entidad activa para originación de créditos
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '16px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '16px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalFinancieraOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingFinanciera}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {savingFinanciera ? 'Guardando...' : editingFinanciera ? 'Actualizar' : 'Crear Financiera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR PROVEEDOR EN CATÁLOGO */}
      {/* ============================================================== */}
      {modalCatalogoOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Registrar Integración en Catálogo
              </h3>
              <button
                type="button"
                onClick={() => setModalCatalogoOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCatalogo} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Código Identificador (Único) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TRANSUNION, DATACREDITO, JUMIO"
                  value={catalogoForm.codigo}
                  onChange={(e) => setCatalogoForm({ ...catalogoForm, codigo: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Nombre del Proveedor / Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: TransUnion Scoring API"
                  value={catalogoForm.nombre}
                  onChange={(e) => setCatalogoForm({ ...catalogoForm, nombre: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Tipo de Servicio
                </label>
                <select
                  value={catalogoForm.tipo}
                  onChange={(e) => setCatalogoForm({ ...catalogoForm, tipo: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="BIOMETRIA">BIOMETRÍA / VALIDACIÓN DE IDENTIDAD</option>
                  <option value="FIRMA_DIGITAL">FIRMA DIGITAL / PAGARÉS</option>
                  <option value="CENTRAL_RIESGO">CENTRAL DE RIESGO / SCORING</option>
                  <option value="SMS_OTP">NOTIFICACIÓN SMS / OTP</option>
                  <option value="PASARELA_PAGO">PASARELA DE PAGO</option>
                  <option value="OTRO">OTRO</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  URL Base Predeterminada
                </label>
                <input
                  type="text"
                  placeholder="https://api.proveedor.com"
                  value={catalogoForm.urlBase}
                  onChange={(e) => setCatalogoForm({ ...catalogoForm, urlBase: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Descripción de la función del proveedor..."
                  value={catalogoForm.descripcion}
                  onChange={(e) => setCatalogoForm({ ...catalogoForm, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '10px',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '16px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setModalCatalogoOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCatalogo}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {savingCatalogo ? 'Registrando...' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
