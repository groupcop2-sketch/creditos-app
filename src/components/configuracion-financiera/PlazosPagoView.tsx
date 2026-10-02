import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, SlidersHorizontal, X, Calendar, Clock } from 'lucide-react';
import { api, type PlazoPagoItem } from '../../api';

interface Props {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const PlazosPagoView: React.FC<Props> = ({ token, notify }) => {
  const [plazos, setPlazos] = useState<PlazoPagoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [unidadFilter, setUnidadFilter] = useState<'TODOS' | 'DIAS' | 'MESES'>('TODOS');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlazo, setEditingPlazo] = useState<PlazoPagoItem | null>(null);
  const [formData, setFormData] = useState({
    plazo: 30,
    unidad: 'DIAS' as 'DIAS' | 'MESES',
    descripcion: '',
    activo: true
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadPlazos = async () => {
    setLoading(true);
    try {
      const data = await api.listPlazos(token, unidadFilter === 'TODOS' ? undefined : unidadFilter);
      setPlazos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar plazos de pago';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlazos();
  }, [unidadFilter]);

  const filteredPlazos = useMemo(() => {
    if (!search.trim()) return plazos;
    const q = search.toLowerCase();
    return plazos.filter(
      (p) =>
        String(p.plazo).includes(q) ||
        p.unidad.toLowerCase().includes(q) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
    );
  }, [plazos, search]);

  const totalPages = Math.ceil(filteredPlazos.length / pageSize) || 1;
  const paginatedPlazos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPlazos.slice(start, start + pageSize);
  }, [filteredPlazos, page]);

  const openCreateModal = () => {
    setEditingPlazo(null);
    setFormData({
      plazo: unidadFilter === 'MESES' ? 12 : 30,
      unidad: unidadFilter === 'MESES' ? 'MESES' : 'DIAS',
      descripcion: '',
      activo: true
    });
    setModalOpen(true);
  };

  const openEditModal = (item: PlazoPagoItem) => {
    setEditingPlazo(item);
    setFormData({
      plazo: item.plazo,
      unidad: item.unidad,
      descripcion: item.descripcion || '',
      activo: item.activo
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.plazo <= 0) {
      notify('El plazo debe ser mayor a 0', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editingPlazo) {
        await api.updatePlazo(token, editingPlazo.id, formData);
        notify('Plazo actualizado exitosamente', 'success');
      } else {
        await api.createPlazo(token, formData);
        notify('Plazo creado exitosamente', 'success');
      }
      setModalOpen(false);
      loadPlazos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar plazo';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletePlazo(token, id);
      notify('Plazo eliminado exitosamente', 'success');
      setDeleteConfirmId(null);
      loadPlazos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar plazo';
      notify(msg, 'error');
    }
  };

  return (
    <div className="module-container">
      {/* Header bar */}
      <div className="module-topbar">
        <div className="module-title-area">
          <h2 className="module-title">Plazo de pago</h2>
          <span className="module-subtitle">Configuración de plazos para solicitudes y liquidación en días y meses</span>
        </div>
        <div className="module-actions">
          <button type="button" className="btn-primary-action" onClick={openCreateModal}>
            <Plus size={16} />
            <span>CREAR</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs by Unidad */}
      <div className="tabs-header-bar">
        <button
          type="button"
          className={`tab-btn-pill ${unidadFilter === 'TODOS' ? 'active' : ''}`}
          onClick={() => {
            setUnidadFilter('TODOS');
            setPage(1);
          }}
        >
          TODOS LOS PLAZOS
        </button>
        <button
          type="button"
          className={`tab-btn-pill ${unidadFilter === 'DIAS' ? 'active' : ''}`}
          onClick={() => {
            setUnidadFilter('DIAS');
            setPage(1);
          }}
        >
          POR DÍAS
        </button>
        <button
          type="button"
          className={`tab-btn-pill ${unidadFilter === 'MESES' ? 'active' : ''}`}
          onClick={() => {
            setUnidadFilter('MESES');
            setPage(1);
          }}
        >
          POR MESES
        </button>
      </div>

      {/* Toolbar: Densidad, Buscar */}
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
          <div className="toolbar-badge">{filteredPlazos.length} registros</div>
        </div>
        <div className="toolbar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar plazo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table matching Screenshot 3 */}
      <div className={`table-responsive density-${density}`}>
        <table className="custom-data-table">
          <thead>
            <tr>
              <th style={{ width: '45%' }}>PLAZO</th>
              <th style={{ width: '25%' }}>UNIDAD</th>
              <th style={{ width: '15%', textAlign: 'center' }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading && plazos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6">Cargando plazos de pago...</td>
              </tr>
            ) : paginatedPlazos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-muted">No se encontraron plazos configurados.</td>
              </tr>
            ) : (
              paginatedPlazos.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold text-primary-dark">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{p.plazo}</span>
                      <span className="text-xs text-gray-500">
                        ({p.descripcion || `${p.plazo} ${p.unidad.toLowerCase()}`})
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`unit-pill ${p.unidad === 'MESES' ? 'unit-meses' : 'unit-dias'}`}>
                      {p.unidad === 'MESES' ? <Calendar size={13} /> : <Clock size={13} />}
                      <span>{p.unidad}</span>
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons-cell">
                      <button
                        type="button"
                        className="btn-icon-action edit"
                        title="Editar plazo"
                        onClick={() => openEditModal(p)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action delete"
                        title="Eliminar plazo"
                        onClick={() => setDeleteConfirmId(p.id)}
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
          {filteredPlazos.length === 0
            ? '0 registros'
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredPlazos.length)} de ${filteredPlazos.length}`}
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

      {/* Modal Crear / Editar Plazo */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingPlazo ? 'Actualizar plazo de pago' : 'Crear plazo de pago'}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="grid-2-col">
                <div className="form-group">
                  <label>Plazo (número) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="Ej: 30"
                    value={formData.plazo}
                    onChange={(e) => setFormData({ ...formData, plazo: parseInt(e.target.value, 10) || 0 })}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Unidad de tiempo *</label>
                  <select
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value as 'DIAS' | 'MESES' })}
                  >
                    <option value="DIAS">DÍAS</option>
                    <option value="MESES">MESES</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Descripción / Etiqueta personalizada</label>
                <input
                  type="text"
                  placeholder={`Ej: ${formData.plazo} ${formData.unidad === 'MESES' ? 'meses' : 'días'}`}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingPlazo ? 'ACTUALIZAR' : 'CREAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
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
              <p>¿Está seguro de que desea eliminar este plazo de pago? Podría estar vinculado a simulaciones de crédito.</p>
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
