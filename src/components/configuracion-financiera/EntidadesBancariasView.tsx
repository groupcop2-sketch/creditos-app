import React, { useState, useEffect, useMemo } from 'react';
import { Download, Plus, Pencil, Trash2, Search, SlidersHorizontal, Table as TableIcon, X, Check } from 'lucide-react';
import { api, type BancoItem } from '../../api';

interface Props {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const EntidadesBancariasView: React.FC<Props> = ({ token, notify }) => {
  const [bancos, setBancos] = useState<BancoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<BancoItem | null>(null);
  const [formData, setFormData] = useState({ nombre: '', codigo: '' });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadBancos = async () => {
    setLoading(true);
    try {
      const data = await api.listBancos(token, search);
      setBancos(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar bancos';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBancos();
  }, [search]);

  const filteredBancos = useMemo(() => {
    if (!search.trim()) return bancos;
    const q = search.toLowerCase();
    return bancos.filter(
      (b) => b.nombre.toLowerCase().includes(q) || (b.codigo && b.codigo.toLowerCase().includes(q))
    );
  }, [bancos, search]);

  const totalPages = Math.ceil(filteredBancos.length / pageSize) || 1;
  const paginatedBancos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBancos.slice(start, start + pageSize);
  }, [filteredBancos, page]);

  const openCreateModal = () => {
    setEditingBanco(null);
    setFormData({ nombre: '', codigo: '' });
    setModalOpen(true);
  };

  const openEditModal = (banco: BancoItem) => {
    setEditingBanco(banco);
    setFormData({ nombre: banco.nombre, codigo: banco.codigo || '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      notify('El nombre del banco es obligatorio', 'warning');
      return;
    }
    setSaving(true);
    try {
      if (editingBanco) {
        await api.updateBanco(token, editingBanco.id, formData);
        notify('Banco actualizado exitosamente', 'success');
      } else {
        await api.createBanco(token, formData);
        notify('Banco creado exitosamente', 'success');
      }
      setModalOpen(false);
      loadBancos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar banco';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteBanco(token, id);
      notify('Banco eliminado exitosamente', 'success');
      setDeleteConfirmId(null);
      loadBancos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar banco';
      notify(msg, 'error');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID,NOMBRE,CODIGO'];
    const rows = bancos.map((b) => `${b.id},"${b.nombre.replace(/"/g, '""')}",${b.codigo || ''}`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `entidades_bancarias_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Archivo de entidades bancarias descargado con éxito', 'success');
  };

  return (
    <div className="module-container">
      {/* Header bar */}
      <div className="module-topbar">
        <div className="module-title-area">
          <h2 className="module-title">Entidades bancarias</h2>
          <span className="module-subtitle">Catálogo oficial de bancos y códigos de compensación ACH</span>
        </div>
        <div className="module-actions">
          <button type="button" className="btn-secondary-action" onClick={handleExportCSV}>
            <Download size={16} />
            <span>DESCARGAR</span>
          </button>
          <button type="button" className="btn-primary-action" onClick={openCreateModal}>
            <Plus size={16} />
            <span>CREAR</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Columnas, Densidad, Buscar */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="toolbar-btn"
            title="Ajustar densidad"
            onClick={() => setDensity((d) => (d === 'normal' ? 'compact' : d === 'compact' ? 'spacious' : 'normal'))}
          >
            <SlidersHorizontal size={15} />
            <span>DENSIDAD: {density.toUpperCase()}</span>
          </button>
          <div className="toolbar-badge">{filteredBancos.length} registros</div>
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

      {/* Table */}
      <div className={`table-responsive density-${density}`}>
        <table className="custom-data-table">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>NOMBRE</th>
              <th style={{ width: '25%' }}>CÓDIGO</th>
              <th style={{ width: '15%', textAlign: 'center' }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading && bancos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6">Cargando entidades bancarias...</td>
              </tr>
            ) : paginatedBancos.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-6 text-muted">No se encontraron entidades bancarias.</td>
              </tr>
            ) : (
              paginatedBancos.map((banco) => (
                <tr key={banco.id}>
                  <td className="font-semibold text-primary-dark">{banco.nombre}</td>
                  <td>
                    <span className="code-pill">{banco.codigo || '—'}</span>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons-cell">
                      <button
                        type="button"
                        className="btn-icon-action edit"
                        title="Editar banco"
                        onClick={() => openEditModal(banco)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action delete"
                        title="Eliminar banco"
                        onClick={() => setDeleteConfirmId(banco.id)}
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
          {filteredBancos.length === 0
            ? '0 registros'
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredBancos.length)} de ${filteredBancos.length}`}
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

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingBanco ? 'Actualizar entidad bancaria' : 'Crear entidad bancaria'}</h3>
              <button type="button" className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label>Nombre del banco *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BANCO AGRARIO"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Código ACH / Compensación</label>
                <input
                  type="text"
                  placeholder="Ej: 040"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editingBanco ? 'ACTUALIZAR' : 'CREAR'}
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
              <p>¿Está seguro de que desea eliminar este banco? Esta acción no se puede deshacer.</p>
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
