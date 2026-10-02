import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, SlidersHorizontal, Table as TableIcon, X, Save, ShieldCheck } from 'lucide-react';
import { api, type FianzaItem, type CalificacionFianzaItem } from '../../api';

interface Props {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const TiposFianzasView: React.FC<Props> = ({ token, notify }) => {
  const [fianzas, setFianzas] = useState<FianzaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');

  // Selected row
  const [selectedFianzaId, setSelectedFianzaId] = useState<number | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFianza, setEditingFianza] = useState<FianzaItem | null>(null);
  const [nombre, setNombre] = useState('');
  const [calificaciones, setCalificaciones] = useState<CalificacionFianzaItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadFianzas = async () => {
    setLoading(true);
    try {
      const data = await api.listFianzas(token, search);
      setFianzas(data);
      if (data.length > 0 && selectedFianzaId === null) {
        setSelectedFianzaId(data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar tipos de fianzas';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFianzas();
  }, [search]);

  const filteredFianzas = useMemo(() => {
    if (!search.trim()) return fianzas;
    const q = search.toLowerCase();
    return fianzas.filter((f) => f.nombre.toLowerCase().includes(q));
  }, [fianzas, search]);

  const totalPages = Math.ceil(filteredFianzas.length / pageSize) || 1;
  const paginatedFianzas = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFianzas.slice(start, start + pageSize);
  }, [filteredFianzas, page]);

  const openCreateModal = () => {
    setEditingFianza(null);
    setNombre('');
    setCalificaciones([
      { letra: 'CATEGORIA A', porcentaje: 20 },
      { letra: 'CATEGORIA B', porcentaje: 25 }
    ]);
    setModalOpen(true);
  };

  const openEditModal = (fianza: FianzaItem) => {
    setEditingFianza(fianza);
    setNombre(fianza.nombre);
    setCalificaciones(
      fianza.calificaciones && fianza.calificaciones.length > 0
        ? fianza.calificaciones.map((c) => ({ ...c }))
        : [{ letra: 'CATEGORIA A', porcentaje: 0 }]
    );
    setModalOpen(true);
  };

  const addCalificacionRow = () => {
    setCalificaciones((current) => [
      ...current,
      { letra: `CATEGORIA ${String.fromCharCode(65 + current.length)}`, porcentaje: 0 }
    ]);
  };

  const removeCalificacionRow = (index: number) => {
    setCalificaciones((current) => current.filter((_, i) => i !== index));
  };

  const updateCalificacionRow = (index: number, field: 'letra' | 'porcentaje', value: string | number) => {
    setCalificaciones((current) =>
      current.map((item, i) => {
        if (i !== index) return item;
        return {
          ...item,
          [field]: field === 'porcentaje' ? Number(value) || 0 : value
        };
      })
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      notify('El nombre de la fianza es obligatorio', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        calificaciones: calificaciones.map((c) => ({
          letra: c.letra.trim(),
          porcentaje: Number(c.porcentaje) || 0
        }))
      };

      if (editingFianza) {
        await api.updateFianza(token, editingFianza.id, payload);
        notify('Fianza actualizada exitosamente', 'success');
      } else {
        await api.createFianza(token, payload);
        notify('Fianza creada exitosamente', 'success');
      }
      setModalOpen(false);
      loadFianzas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar fianza';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteFianza(token, id);
      notify('Fianza eliminada exitosamente', 'success');
      setDeleteConfirmId(null);
      loadFianzas();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar fianza';
      notify(msg, 'error');
    }
  };

  return (
    <div className="module-container">
      {/* Topbar matching Screenshot 1 */}
      <div className="module-topbar">
        <div className="module-title-area">
          <h2 className="module-title">
            <ShieldCheck size={26} color="#0284c7" />
            Tipos de fianzas
          </h2>
          <span className="module-subtitle">
            Catálogo de entidades de garantía, afianzamiento y tabla de calificaciones porcentuales
          </span>
        </div>
        <div className="module-actions">
          <button type="button" className="btn-primary-action" onClick={openCreateModal}>
            <Plus size={16} /> CREAR
          </button>
        </div>
      </div>

      {/* Toolbar matching Screenshot 1 */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => notify('Columnas disponibles: Nombre, Cantidad, Acción', 'info')}
          >
            <TableIcon size={14} /> COLUMNAS
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() =>
              setDensity((current) =>
                current === 'normal' ? 'compact' : current === 'compact' ? 'spacious' : 'normal'
              )
            }
          >
            <SlidersHorizontal size={14} /> DENSIDAD
          </button>
          <span className="toolbar-badge">{filteredFianzas.length} registradas</span>
        </div>

        <div className="toolbar-search">
          <Search size={15} className="search-icon" />
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

      {/* Table matching Screenshot 1 */}
      <div className={`table-wrap density-${density}`}>
        <table className="custom-data-table">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>NOMBRE</th>
              <th style={{ width: '25%', textAlign: 'center' }}>CANTIDAD</th>
              <th style={{ width: '15%', textAlign: 'right' }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                  Cargando tipos de fianzas...
                </td>
              </tr>
            ) : paginatedFianzas.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No se encontraron tipos de fianzas registradas
                </td>
              </tr>
            ) : (
              paginatedFianzas.map((fianza) => {
                const isSelected = selectedFianzaId === fianza.id;
                return (
                  <tr
                    key={fianza.id}
                    onClick={() => setSelectedFianzaId(fianza.id)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(2, 132, 199, 0.08)' : undefined
                    }}
                  >
                    <td>
                      <strong style={{ color: '#0f172a', fontWeight: 700, letterSpacing: '0.01em' }}>
                        {fianza.nombre}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="code-pill" style={{ fontWeight: 800 }}>
                        {fianza.cantidad}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-buttons-cell" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-icon-action edit"
                          title="Editar fianza y calificaciones"
                          onClick={() => openEditModal(fianza)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon-action delete"
                          title="Eliminar fianza"
                          onClick={() => setDeleteConfirmId(fianza.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer matching Screenshot 1 */}
      <div className="table-pagination-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            {selectedFianzaId !== null ? '1 fila seleccionada' : '0 filas seleccionadas'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="page-indicator">
            {filteredFianzas.length > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredFianzas.length)} de ${filteredFianzas.length}` : '0 de 0'}
          </span>
          <div className="pagination-arrows">
            <button
              type="button"
              className="arrow-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              &lt;
            </button>
            <button
              type="button"
              className="arrow-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Modal Fianza (Matching Screenshot 2 with perfection) */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-md" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Fianza</h3>
              <button type="button" className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Nombre * */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: COOPHUMANA"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      background: '#ffffff'
                    }}
                  />
                </div>

                {/* Sub-header Calificación + (+) circular button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '0.4rem', marginTop: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0284c7' }}>
                    Calificación
                  </h4>
                  <button
                    type="button"
                    onClick={addCalificacionRow}
                    title="Agregar calificación"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      display: 'inline-grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {/* Dynamic List of Qualifications matching Screenshot 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {calificaciones.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                      No hay calificaciones agregadas. Haz clic en (+) para agregar categorías.
                    </p>
                  ) : (
                    calificaciones.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.6fr 1fr auto',
                          gap: '0.75rem',
                          alignItems: 'flex-end',
                          background: idx % 2 === 0 ? '#f8fafc' : '#ffffff',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9'
                        }}
                      >
                        {/* Letra * */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                            Letra *
                          </label>
                          <input
                            type="text"
                            required
                            value={item.letra}
                            onChange={(e) => updateCalificacionRow(idx, 'letra', e.target.value)}
                            placeholder="Ej: CATEGORIA A"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}
                          />
                        </div>

                        {/* Porcentaje * */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                            Porcentaje *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            value={item.porcentaje}
                            onChange={(e) => updateCalificacionRow(idx, 'porcentaje', e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              fontFamily: 'monospace'
                            }}
                          />
                        </div>

                        {/* Red Trash Delete Button */}
                        <div style={{ paddingBottom: '3px' }}>
                          <button
                            type="button"
                            onClick={() => removeCalificacionRow(idx)}
                            title="Eliminar fila"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              padding: '6px',
                              borderRadius: '4px',
                              display: 'inline-grid',
                              placeItems: 'center'
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer with ACTUALIZAR / GUARDAR button matching Screenshot 2 */}
              <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', background: '#f8fafc' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.6rem',
                    background: '#02569b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 86, 155, 0.35)'
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Guardando...' : editingFianza ? 'ACTUALIZAR' : 'GUARDAR'}
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
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                ¿Estás seguro de que deseas eliminar este tipo de fianza y todas sus calificaciones asociadas?
              </p>
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
