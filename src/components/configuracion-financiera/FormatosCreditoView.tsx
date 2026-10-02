import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, SlidersHorizontal, X, Save, CheckSquare, Square, Layers } from 'lucide-react';
import { api, type FormatoCreditoItem } from '../../api';

interface Props {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
  onFormatSelected?: (formato: FormatoCreditoItem) => void;
}

// 19 exact fields defined in 3 columns matching Screenshot 4
const COL1_FIELDS = [
  { key: 'valorCreditoSolicitar', label: 'Valor del crédito al solicitar' },
  { key: 'plazo', label: 'Plazo' },
  { key: 'planAmortizacionSolicitar', label: 'Plan de amortización al solicitar' },
  { key: 'primeraCuota', label: 'Primera cuota' },
  { key: 'cartera', label: 'Cartera' },
  { key: 'atributosCredito', label: 'Atributos del crédito' },
  { key: 'extractos', label: 'Extractos' }
];

const COL2_FIELDS = [
  { key: 'valorDesembolso', label: 'Valor de desembolso' },
  { key: 'tasaInteresSolicitar', label: 'Tasa de interés al solicitar' },
  { key: 'tasaInteres', label: 'Tasa de interés' },
  { key: 'interesAjustable', label: 'Interés ajustable' },
  { key: 'calificacionRiesgo', label: 'Calificación de riesgo' },
  { key: 'planAmortizacion', label: 'Plan de amortización' }
];

const COL3_FIELDS = [
  { key: 'valorCuota', label: 'Valor de la cuota' },
  { key: 'atributosCreditoSolicitar', label: 'Atributos del crédito al solicitar' },
  { key: 'valorCredito', label: 'Valor del crédito' },
  { key: 'metodo', label: 'Método' },
  { key: 'saldoCredito', label: 'Saldo del crédito' },
  { key: 'documentosCredito', label: 'Documentos del crédito' }
];

const ALL_FIELDS = [...COL1_FIELDS, ...COL2_FIELDS, ...COL3_FIELDS];

export const FormatosCreditoView: React.FC<Props> = ({ token, notify, onFormatSelected }) => {
  const [formatos, setFormatos] = useState<FormatoCreditoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFormato, setEditingFormato] = useState<FormatoCreditoItem | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [camposState, setCamposState] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ALL_FIELDS.forEach((f) => {
      init[f.key] = true;
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadFormatos = async () => {
    setLoading(true);
    try {
      const data = await api.listFormatosCredito(token);
      setFormatos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar formatos de crédito';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFormatos();
  }, []);

  const filteredFormatos = useMemo(() => {
    if (!search.trim()) return formatos;
    const q = search.toLowerCase();
    return formatos.filter(
      (f) => f.nombre.toLowerCase().includes(q) || (f.descripcion && f.descripcion.toLowerCase().includes(q))
    );
  }, [formatos, search]);

  const totalPages = Math.ceil(filteredFormatos.length / pageSize) || 1;
  const paginatedFormatos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFormatos.slice(start, start + pageSize);
  }, [filteredFormatos, page]);

  // Check if all fields are selected
  const allSelected = useMemo(() => {
    return ALL_FIELDS.every((f) => camposState[f.key] === true);
  }, [camposState]);

  const handleToggleSelectAll = () => {
    const nextVal = !allSelected;
    const updated: Record<string, boolean> = {};
    ALL_FIELDS.forEach((f) => {
      updated[f.key] = nextVal;
    });
    setCamposState(updated);
  };

  const handleFieldChange = (key: string, checked: boolean) => {
    setCamposState((prev) => ({
      ...prev,
      [key]: checked
    }));
  };

  const openCreateModal = () => {
    setEditingFormato(null);
    setNombre('');
    setDescripcion('');
    const full: Record<string, boolean> = {};
    ALL_FIELDS.forEach((f) => {
      full[f.key] = true;
    });
    setCamposState(full);
    setModalOpen(true);
  };

  const openEditModal = (f: FormatoCreditoItem) => {
    setEditingFormato(f);
    setNombre(f.nombre);
    setDescripcion(f.descripcion || '');
    const current: Record<string, boolean> = {};
    ALL_FIELDS.forEach((field) => {
      current[field.key] = f.campos && typeof f.campos[field.key] === 'boolean' ? f.campos[field.key] : false;
    });
    setCamposState(current);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      notify('El nombre del formato es obligatorio', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editingFormato) {
        const updated = await api.updateFormatoCredito(token, editingFormato.id, {
          nombre,
          descripcion,
          campos: camposState,
          activo: true
        });
        notify('Formato de crédito actualizado exitosamente', 'success');
        if (onFormatSelected) onFormatSelected(updated);
      } else {
        const created = await api.createFormatoCredito(token, {
          nombre,
          descripcion,
          campos: camposState,
          activo: true
        });
        notify('Formato de crédito creado exitosamente', 'success');
        if (onFormatSelected) onFormatSelected(created);
      }
      setModalOpen(false);
      loadFormatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar formato';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteFormatoCredito(token, id);
      notify('Formato de crédito eliminado', 'success');
      setDeleteConfirmId(null);
      loadFormatos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar formato';
      notify(msg, 'error');
    }
  };

  return (
    <div className="module-container">
      {/* Header Bar */}
      <div className="module-topbar">
        <div className="module-title-area">
          <h2 className="module-title">Formatos de créditos</h2>
          <span className="module-subtitle">Estructura y catálogo de campos visibles y requisitos para configurar créditos</span>
        </div>
        <div className="module-actions">
          <button type="button" className="btn-primary-action" onClick={openCreateModal}>
            <Plus size={16} />
            <span>CREAR</span>
          </button>
        </div>
      </div>

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
          <div className="toolbar-badge">{filteredFormatos.length} formatos</div>
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

      {/* Table matching Screenshot 4 */}
      <div className={`table-responsive density-${density}`}>
        <table className="custom-data-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>NOMBRE</th>
              <th style={{ width: '35%' }}>N° DE REQUISITOS</th>
              <th style={{ width: '15%', textAlign: 'center' }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading && formatos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6">Cargando formatos de créditos...</td>
              </tr>
            ) : paginatedFormatos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-muted">No se encontraron formatos de crédito.</td>
              </tr>
            ) : (
              paginatedFormatos.map((item) => (
                <tr key={item.id}>
                  <td className="font-semibold text-primary-dark">
                    <div>
                      <div className="text-base font-bold">{item.nombre}</div>
                      {item.descripcion && <div className="text-xs text-gray-500">{item.descripcion}</div>}
                    </div>
                  </td>
                  <td>
                    <span className="requisitos-pill">
                      <Layers size={13} />
                      <span>{item.numRequisitos} de 19 campos habilitados</span>
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons-cell">
                      <button
                        type="button"
                        className="btn-icon-action edit"
                        title="Editar formato de crédito"
                        onClick={() => openEditModal(item)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action delete"
                        title="Eliminar formato"
                        onClick={() => setDeleteConfirmId(item.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination-footer">
        <span>
          {filteredFormatos.length === 0
            ? '0 formatos'
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredFormatos.length)} de ${filteredFormatos.length}`}
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

      {/* Modal matching Screenshot 4 EXACTLY */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-xl formato-credito-modal">
            {/* Modal Top Bar */}
            <div className="modal-header-with-action">
              <h3 className="modal-title-bold">
                {editingFormato ? 'Actualizar formato de crédito' : 'Crear formato de crédito'}
              </h3>
              <div className="header-right-controls">
                <label className="select-all-label" onClick={handleToggleSelectAll}>
                  <span>Seleccionar todo</span>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                    className="custom-checkbox"
                  />
                </label>
                <button type="button" className="btn-close-modal" onClick={() => setModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="modal-body-form">
              {/* Formato Name input */}
              <div className="form-group mb-4" style={{ maxWidth: '340px' }}>
                <label className="input-label-required">Nombre del formato *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: CREDITO"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value.toUpperCase())}
                  className="form-control-input"
                  autoFocus
                />
              </div>

              {/* 3-Column Grid of 19 Checkboxes matching Screenshot 4 */}
              <div className="campos-three-columns-grid">
                {/* Column 1 */}
                <div className="campos-column">
                  {COL1_FIELDS.map((field) => (
                    <label key={field.key} className="field-checkbox-row">
                      <span className="field-label">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={!!camposState[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        className="custom-checkbox"
                      />
                    </label>
                  ))}
                </div>

                {/* Column 2 */}
                <div className="campos-column">
                  {COL2_FIELDS.map((field) => (
                    <label key={field.key} className="field-checkbox-row">
                      <span className="field-label">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={!!camposState[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        className="custom-checkbox"
                      />
                    </label>
                  ))}
                </div>

                {/* Column 3 */}
                <div className="campos-column">
                  {COL3_FIELDS.map((field) => (
                    <label key={field.key} className="field-checkbox-row">
                      <span className="field-label">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={!!camposState[field.key]}
                        onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                        className="custom-checkbox"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer with ACTUALIZAR / CREAR button */}
              <div className="formato-modal-footer">
                <button type="submit" className="btn-modal-submit" disabled={saving}>
                  <Save size={16} />
                  <span>{saving ? 'GUARDANDO...' : editingFormato ? 'ACTUALIZAR' : 'CREAR'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-sm">
            <div className="modal-header">
              <h3>Confirmar eliminación</h3>
              <button type="button" className="btn-close-modal" onClick={() => setDeleteConfirmId(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p>¿Está seguro de que desea eliminar este formato de crédito? Las líneas de crédito que lo usen perderán su plantilla.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-danger" onClick={() => handleDelete(deleteConfirmId)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
