import React, { useState, useEffect, useMemo } from 'react';
import { Plus, SlidersHorizontal, Search, RefreshCw, Globe, CheckCircle2, AlertCircle, X, ChevronRight, Calculator } from 'lucide-react';
import { api, type TasaReferenciaItem, type ValidarEndpointResult } from '../../api';

interface Props {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

const MONTHS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

export const TasasInteresView: React.FC<Props> = ({ token, notify }) => {
  const [activeTab, setActiveTab] = useState<'USURA' | 'DTF'>('USURA');
  const [tasas, setTasas] = useState<TasaReferenciaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');

  // Endpoint datos.gov.co
  const [endpointUrl, setEndpointUrl] = useState(
    'https://www.datos.gov.co/resource/pare-7x5i.json?$order=vigencia_desde%20DESC&$limit=10'
  );
  const [showEndpointTools, setShowEndpointTools] = useState(false);
  const [validatingEndpoint, setValidatingEndpoint] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidarEndpointResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal Crear
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipoTasa: 'USURA',
    mes: 'OCTUBRE',
    ano: 2026,
    base: 365,
    tasaEa: 28.59,
    resolucion: '',
    modalidad: 'CONSUMO Y ORDINARIO'
  });
  const [saving, setSaving] = useState(false);

  // Live preview for calculation
  const livePreview = useMemo(() => {
    const ea = Number(formData.tasaEa);
    if (isNaN(ea) || ea <= 0) return null;
    const r = ea / 100;
    const b = Number(formData.base) || 365;
    return {
      diaria: ((Math.pow(1 + r, 1 / b) - 1) * 100).toFixed(5),
      semanal: ((Math.pow(1 + r, 7 / 365) - 1) * 100).toFixed(5),
      quincenal: ((Math.pow(1 + r, 1 / 24) - 1) * 100).toFixed(5),
      mensual: ((Math.pow(1 + r, 1 / 12) - 1) * 100).toFixed(5),
      bimestral: ((Math.pow(1 + r, 1 / 6) - 1) * 100).toFixed(5),
      trimestral: ((Math.pow(1 + r, 1 / 4) - 1) * 100).toFixed(5),
      cuatrimestral: ((Math.pow(1 + r, 1 / 3) - 1) * 100).toFixed(5)
    };
  }, [formData.tasaEa, formData.base]);

  const loadTasas = async () => {
    setLoading(true);
    try {
      const data = await api.listTasas(token, activeTab);
      setTasas(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar tasas';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasas();
  }, [activeTab]);

  const filteredTasas = useMemo(() => {
    if (!search.trim()) return tasas;
    const q = search.toLowerCase();
    return tasas.filter(
      (t) =>
        t.mes.toLowerCase().includes(q) ||
        String(t.ano).includes(q) ||
        String(t.base).includes(q) ||
        (t.resolucion && t.resolucion.toLowerCase().includes(q))
    );
  }, [tasas, search]);

  const totalPages = Math.ceil(filteredTasas.length / pageSize) || 1;
  const paginatedTasas = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTasas.slice(start, start + pageSize);
  }, [filteredTasas, page]);

  const handleValidarEndpoint = async () => {
    setValidatingEndpoint(true);
    setValidationResult(null);
    try {
      const res = await api.validarEndpointTasas(token, endpointUrl);
      setValidationResult(res);
      if (res.valido) {
        notify('Endpoint de datos.gov.co validado con éxito', 'success');
      } else {
        notify(res.mensaje || 'Error al validar el endpoint', 'warning');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al validar endpoint';
      notify(msg, 'error');
    } finally {
      setValidatingEndpoint(false);
    }
  };

  const handleSincronizar = async () => {
    setSyncing(true);
    try {
      const res = await api.sincronizarTasas(token, endpointUrl);
      notify(res.mensaje || 'Tasas sincronizadas con éxito', 'success');
      loadTasas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al sincronizar con datos.gov.co';
      notify(msg, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createTasa(token, {
        tipoTasa: activeTab,
        mes: formData.mes,
        ano: formData.ano,
        base: formData.base,
        tasaEa: formData.tasaEa,
        resolucion: formData.resolucion,
        modalidad: formData.modalidad
      });
      notify('Tasa guardada exitosamente', 'success');
      setModalOpen(false);
      loadTasas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar tasa';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatRate = (val?: number | null) => {
    if (val === null || val === undefined) return '0.00000 %';
    return `${Number(val).toFixed(5)} %`;
  };

  return (
    <div className="module-container">
      {/* Module Title */}
      <div className="module-topbar">
        <div className="module-title-area">
          <h2 className="module-title">Tasas</h2>
          <span className="module-subtitle">Tasas de usura, DTF e interés de mora certificadas por Superfinanciera</span>
        </div>
        <div className="module-actions">
          <button
            type="button"
            className="btn-secondary-action"
            onClick={() => setShowEndpointTools(!showEndpointTools)}
          >
            <Globe size={16} />
            <span>DATOS.GOV.CO</span>
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => {
              setFormData({
                tipoTasa: activeTab,
                mes: 'OCTUBRE',
                ano: 2026,
                base: 365,
                tasaEa: 28.59,
                resolucion: '',
                modalidad: 'CONSUMO Y ORDINARIO'
              });
              setModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>CREAR</span>
          </button>
        </div>
      </div>

      {/* Tabs USURA / DTF */}
      <div className="tabs-header-bar">
        <button
          type="button"
          className={`tab-btn-pill ${activeTab === 'USURA' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('USURA');
            setPage(1);
          }}
        >
          USURA
        </button>
        <button
          type="button"
          className={`tab-btn-pill ${activeTab === 'DTF' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('DTF');
            setPage(1);
          }}
        >
          DTF
        </button>
      </div>

      {/* Panel Datos.gov.co Tools */}
      {showEndpointTools && (
        <div className="endpoint-validation-panel">
          <div className="endpoint-panel-header">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-primary-blue" />
              <strong>Integración y Validación con datos.gov.co</strong>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-700"
              onClick={() => setShowEndpointTools(false)}
            >
              <X size={16} />
            </button>
          </div>
          <p className="endpoint-desc">
            Consulta oficial del dataset de la Superintendencia Financiera de Colombia (SFC) para la Tasa de Interés
            Bancario Corriente (TIBC, dataset <code>pare-7x5i</code>). La tasa de usura se calcula automáticamente como
            1.5 veces el interés bancario corriente de consumo y ordinario.
          </p>

          <div className="endpoint-input-group">
            <input
              type="text"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://www.datos.gov.co/resource/pare-7x5i.json?$order=vigencia_desde DESC&$limit=1"
              className="endpoint-input"
            />
            <button
              type="button"
              className="btn-validate"
              onClick={handleValidarEndpoint}
              disabled={validatingEndpoint}
            >
              {validatingEndpoint ? 'Validando...' : 'Validar Endpoint'}
            </button>
            <button
              type="button"
              className="btn-sync"
              onClick={handleSincronizar}
              disabled={syncing}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              <span>{syncing ? 'Sincronizando...' : 'Sincronizar Tasas'}</span>
            </button>
          </div>

          {validationResult && (
            <div className={`validation-alert ${validationResult.valido ? 'success' : 'error'}`}>
              <div className="flex items-center gap-2 mb-1">
                {validationResult.valido ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <strong>{validationResult.mensaje}</strong>
              </div>
              {validationResult.valido && validationResult.muestra && validationResult.muestra.length > 0 && (
                <div className="sample-data-box">
                  <span className="sample-label">Muestra del último registro obtenido de la API:</span>
                  <pre>{JSON.stringify(validationResult.muestra[0], null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Toolbar: Densidad, Columnas, Buscar */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => setDensity((d) => (d === 'normal' ? 'compact' : d === 'compact' ? 'spacious' : 'normal'))}
          >
            <SlidersHorizontal size={15} />
            <span>DENSIDAD: {density.toUpperCase()}</span>
          </button>
          <div className="toolbar-badge">{filteredTasas.length} registros</div>
        </div>
        <div className="toolbar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Custom Table Exact matching Screenshot 2 */}
      <div className={`table-responsive density-${density}`}>
        <table className="custom-data-table rates-table">
          <thead>
            <tr>
              <th>MES</th>
              <th>AÑO</th>
              <th>BASE</th>
              <th>{activeTab === 'USURA' ? 'USURA E.A' : 'DTF E.A'}</th>
              <th>DIARIA</th>
              <th>SEMANAL</th>
              <th>MENSUAL</th>
              <th>QUINCENAL</th>
              <th>BIMESTRAL</th>
              <th>TRIMESTRAL</th>
              <th>CUATRIM.</th>
            </tr>
          </thead>
          <tbody>
            {loading && tasas.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-6">Cargando tasas de referencia...</td>
              </tr>
            ) : paginatedTasas.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-6 text-muted">No se encontraron registros de tasas.</td>
              </tr>
            ) : (
              paginatedTasas.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold text-primary-dark">{t.mes}</td>
                  <td>{t.ano}</td>
                  <td>{t.base || '—'}</td>
                  <td className="font-bold text-accent-blue">{Number(t.tasaEa).toFixed(2)} %</td>
                  <td>{formatRate(t.tasaDiaria)}</td>
                  <td>{formatRate(t.tasaSemanal)}</td>
                  <td>{formatRate(t.tasaMensual)}</td>
                  <td>{formatRate(t.tasaQuincenal)}</td>
                  <td>{formatRate(t.tasaBimestral)}</td>
                  <td>{formatRate(t.tasaTrimestral)}</td>
                  <td>{formatRate(t.tasaCuatrimestral)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination-footer">
        <span>
          {filteredTasas.length === 0
            ? '0 registros'
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredTasas.length)} de ${filteredTasas.length}`}
        </span>
        <div className="pagination-arrows">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="arrow-btn"
          >
            ‹
          </button>
          <span className="page-indicator">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="arrow-btn"
          >
            ›
          </button>
        </div>
      </div>

      {/* Modal Crear Tasa */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-md">
            <div className="modal-header">
              <h3>{`Crear tasa ${activeTab}`}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="grid-2-col">
                <div className="form-group">
                  <label>Mes *</label>
                  <select
                    value={formData.mes}
                    onChange={(e) => setFormData({ ...formData, mes: e.target.value })}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Año *</label>
                  <input
                    type="number"
                    required
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group">
                  <label>Base cálculo *</label>
                  <select
                    value={formData.base}
                    onChange={(e) => setFormData({ ...formData, base: Number(e.target.value) })}
                  >
                    <option value={365}>365 días</option>
                    <option value={360}>360 días</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tasa Efectiva Anual (E.A. %) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ej: 28.59"
                    value={formData.tasaEa}
                    onChange={(e) => setFormData({ ...formData, tasaEa: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="form-group">
                  <label>Resolución SFC (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: 1472"
                    value={formData.resolucion}
                    onChange={(e) => setFormData({ ...formData, resolucion: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Modalidad de crédito</label>
                  <input
                    type="text"
                    value={formData.modalidad}
                    onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                  />
                </div>
              </div>

              {/* Live Preview of Calculated Equivalent Periodic Rates */}
              {livePreview && (
                <div className="calculation-preview-box">
                  <div className="preview-title">
                    <Calculator size={15} />
                    <span>Tasas periódicas equivalentes calculadas automáticamente:</span>
                  </div>
                  <div className="preview-grid">
                    <div>
                      <span>Diaria:</span> <strong>{livePreview.diaria} %</strong>
                    </div>
                    <div>
                      <span>Semanal:</span> <strong>{livePreview.semanal} %</strong>
                    </div>
                    <div>
                      <span>Quincenal:</span> <strong>{livePreview.quincenal} %</strong>
                    </div>
                    <div>
                      <span>Mensual:</span> <strong>{livePreview.mensual} %</strong>
                    </div>
                    <div>
                      <span>Bimestral:</span> <strong>{livePreview.bimestral} %</strong>
                    </div>
                    <div>
                      <span>Trimestral:</span> <strong>{livePreview.trimestral} %</strong>
                    </div>
                    <div>
                      <span>Cuatrim.:</span> <strong>{livePreview.cuatrimestral} %</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'CREAR TASA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
