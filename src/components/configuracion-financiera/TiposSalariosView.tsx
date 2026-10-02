import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, SlidersHorizontal, Table as TableIcon, X, Save, DollarSign, Percent, Landmark } from 'lucide-react';
import { api, type ParametroFinancieroItem } from '../../api';

interface Props {
  token: string;
  notify: (text: string, tone?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const TiposSalariosView: React.FC<Props> = ({ token, notify }) => {
  const [parametros, setParametros] = useState<ParametroFinancieroItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'SALARIOS' | 'IVA'>('TODOS');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<ParametroFinancieroItem | null>(null);
  const [formData, setFormData] = useState<{
    codigo: string;
    nombre: string;
    valor: string;
    unidad: 'VALOR' | 'PORCENTAJE';
    vigenciaDesde: string;
    vigenciaHasta: string;
    activo: boolean;
  }>({
    codigo: '',
    nombre: '',
    valor: '',
    unidad: 'VALOR',
    vigenciaDesde: new Date().toISOString().split('T')[0],
    vigenciaHasta: '',
    activo: true
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const loadParametros = async () => {
    setLoading(true);
    try {
      const data = await api.listSalariosParametros(token, search, tipoFiltro);
      setParametros(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar salarios y parámetros';
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParametros();
  }, [search, tipoFiltro]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return parametros;
    const q = search.toLowerCase();
    return parametros.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    );
  }, [parametros, search]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page]);

  const formatValor = (item: ParametroFinancieroItem): string => {
    if (item.unidad === 'PORCENTAJE') {
      return `${item.valor}%`;
    }
    // Formato moneda colombiana exacto al Screenshot 3: $1.750.905
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(item.valor).replace('COP', '').trim();
  };

  const openCreateModal = (presetTipo?: 'SALARIOS' | 'IVA') => {
    setEditingParam(null);
    if (presetTipo === 'IVA') {
      setFormData({
        codigo: 'IVA',
        nombre: 'Impuesto al Valor Agregado',
        valor: '19',
        unidad: 'PORCENTAJE',
        vigenciaDesde: new Date().toISOString().split('T')[0],
        vigenciaHasta: '',
        activo: true
      });
    } else {
      setFormData({
        codigo: 'SMMLV',
        nombre: 'SMMLV',
        valor: '1750905',
        unidad: 'VALOR',
        vigenciaDesde: new Date().toISOString().split('T')[0],
        vigenciaHasta: '',
        activo: true
      });
    }
    setModalOpen(true);
  };

  const openEditModal = (param: ParametroFinancieroItem) => {
    setEditingParam(param);
    setFormData({
      codigo: param.codigo,
      nombre: param.nombre,
      valor: String(param.valor),
      unidad: param.unidad,
      vigenciaDesde: param.vigenciaDesde ? param.vigenciaDesde.split('T')[0] : '',
      vigenciaHasta: param.vigenciaHasta ? param.vigenciaHasta.split('T')[0] : '',
      activo: param.activo
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      notify('El código y nombre son obligatorios', 'warning');
      return;
    }
    if (formData.valor === '' || isNaN(Number(formData.valor))) {
      notify('Ingresa un valor numérico válido', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        codigo: formData.codigo.trim().toUpperCase(),
        nombre: formData.nombre.trim(),
        valor: Number(formData.valor),
        unidad: formData.unidad,
        vigenciaDesde: formData.vigenciaDesde || new Date().toISOString().split('T')[0],
        vigenciaHasta: formData.vigenciaHasta || null,
        activo: formData.activo
      };

      if (editingParam) {
        await api.updateSalarioParametro(token, editingParam.id, payload);
        notify('Parámetro actualizado exitosamente', 'success');
      } else {
        await api.createSalarioParametro(token, payload);
        notify('Parámetro creado exitosamente', 'success');
      }
      setModalOpen(false);
      loadParametros();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar parámetro';
      notify(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteSalarioParametro(token, id);
      notify('Parámetro eliminado exitosamente', 'success');
      setDeleteConfirmId(null);
      loadParametros();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar parámetro';
      notify(msg, 'error');
    }
  };

  return (
    <div className="module-container">
      {/* Topbar matching Screenshot 3 */}
      <div className="module-topbar">
        <div className="module-title-area">
          <h2 className="module-title">
            <Landmark size={26} color="#0284c7" />
            Tipos de salarios
          </h2>
          <span className="module-subtitle">
            Parametrización de salarios legales (SMMLV), auxilio de transporte e impuestos aplicables (IVA)
          </span>
        </div>
        <div className="module-actions">
          <button type="button" className="btn-primary-action" onClick={() => openCreateModal('SALARIOS')}>
            <Plus size={16} /> CREAR
          </button>
        </div>
      </div>

      {/* Tabs Filter for Salarios vs IVA */}
      <div className="tabs-header-bar" style={{ width: 'fit-content', marginTop: '0.25rem' }}>
        <button
          type="button"
          className={`tab-btn-pill ${tipoFiltro === 'TODOS' ? 'active' : ''}`}
          onClick={() => setTipoFiltro('TODOS')}
        >
          Todos los parámetros
        </button>
        <button
          type="button"
          className={`tab-btn-pill ${tipoFiltro === 'SALARIOS' ? 'active' : ''}`}
          onClick={() => setTipoFiltro('SALARIOS')}
        >
          <DollarSign size={14} /> Salarios (SMMLV)
        </button>
        <button
          type="button"
          className={`tab-btn-pill ${tipoFiltro === 'IVA' ? 'active' : ''}`}
          onClick={() => setTipoFiltro('IVA')}
        >
          <Percent size={14} /> Impuesto (IVA)
        </button>
      </div>

      {/* Toolbar matching Screenshot 3 */}
      <div className="module-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => notify('Columnas: Nombre, Valor, Acción', 'info')}
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
          <span className="toolbar-badge">{filteredItems.length} registros</span>
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

      {/* Table matching Screenshot 3 */}
      <div className={`table-wrap density-${density}`}>
        <table className="custom-data-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>NOMBRE</th>
              <th style={{ width: '35%', textAlign: 'right' }}>VALOR</th>
              <th style={{ width: '15%', textAlign: 'right' }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                  Cargando salarios y parámetros...
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No hay tipos de salarios o parámetros registrados
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: '#0f172a', fontWeight: 700 }}>{item.nombre}</strong>
                      {item.unidad === 'PORCENTAJE' ? (
                        <span className="unit-pill unit-dias" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                          IVA
                        </span>
                      ) : (
                        <span className="code-pill" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                          {item.codigo}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.95rem',
                        color: item.unidad === 'PORCENTAJE' ? '#0284c7' : '#059669',
                        fontWeight: 800
                      }}
                    >
                      {formatValor(item)}
                    </strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="action-buttons-cell">
                      <button
                        type="button"
                        className="btn-icon-action edit"
                        title="Editar parámetro"
                        onClick={() => openEditModal(item)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action delete"
                        title="Eliminar parámetro"
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

      {/* Footer matching Screenshot 3 */}
      <div className="table-pagination-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem' }}>
        <span className="page-indicator">
          {filteredItems.length > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredItems.length)} de ${filteredItems.length}` : '0 de 0'}
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

      {/* Modal Crear / Editar Salario o Parámetro */}
      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-md" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {editingParam ? 'Editar tipo de salario / parámetro' : 'Crear tipo de salario / parámetro'}
              </h3>
              <button type="button" className="btn-close-modal" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '0.85rem' }}>
                  {/* Código */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      Código *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.codigo}
                      onChange={(e) => setFormData((c) => ({ ...c, codigo: e.target.value }))}
                      placeholder="Ej: SMMLV o IVA"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  {/* Nombre */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData((c) => ({ ...c, nombre: e.target.value }))}
                      placeholder="Ej: SMMLV o Impuesto al Valor Agregado"
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '0.85rem' }}>
                  {/* Unidad / Tipo */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      Tipo de valor *
                    </label>
                    <select
                      value={formData.unidad}
                      onChange={(e) => setFormData((c) => ({ ...c, unidad: e.target.value as 'VALOR' | 'PORCENTAJE' }))}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        background: '#ffffff'
                      }}
                    >
                      <option value="VALOR">Valor monetario ($ COP)</option>
                      <option value="PORCENTAJE">Porcentaje (% IVA)</option>
                    </select>
                  </div>

                  {/* Valor */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      Valor {formData.unidad === 'VALOR' ? '($)' : '(%)'} *
                    </label>
                    <input
                      type="number"
                      step={formData.unidad === 'PORCENTAJE' ? '0.01' : '1'}
                      required
                      value={formData.valor}
                      onChange={(e) => setFormData((c) => ({ ...c, valor: e.target.value }))}
                      placeholder={formData.unidad === 'PORCENTAJE' ? '19' : '1750905'}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.8rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                {/* Previsualización del valor */}
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Vista previa formateada:</span>
                  <strong style={{ fontSize: '1.1rem', color: formData.unidad === 'PORCENTAJE' ? '#0284c7' : '#059669', fontFamily: 'monospace' }}>
                    {formData.unidad === 'PORCENTAJE'
                      ? `${formData.valor || 0}%`
                      : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(formData.valor) || 0).replace('COP', '').trim()}
                  </strong>
                </div>

                {/* Fechas de vigencia */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                      Vigencia desde
                    </label>
                    <input
                      type="date"
                      value={formData.vigenciaDesde}
                      onChange={(e) => setFormData((c) => ({ ...c, vigenciaDesde: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.86rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '0.25rem' }}>
                      Vigencia hasta (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.vigenciaHasta}
                      onChange={(e) => setFormData((c) => ({ ...c, vigenciaHasta: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '0.86rem'
                      }}
                    />
                  </div>
                </div>
              </div>

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
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 86, 155, 0.35)'
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Guardando...' : editingParam ? 'ACTUALIZAR' : 'GUARDAR'}
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
                ¿Estás seguro de que deseas eliminar este tipo de salario / parámetro?
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
