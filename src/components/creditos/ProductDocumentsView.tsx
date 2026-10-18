import { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileStack,
  FileText,
  FolderOpen,
  Info,
  LayoutTemplate,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import type {
  AddressCatalogItem,
  DocumentTemplateDetail,
  DocumentTemplateRow,
  DocumentVariable,
  ProductoCreditoRow,
  ProductoDocumentoRow
} from '../../api';
import type { FeedbackTone } from '../../FeedbackAlert';
import { RichDocumentEditor } from '../../RichDocumentEditor';
import { PdfFieldMapper } from '../../PdfFieldMapper';
import { SearchableDropdown } from './SearchableDropdown';
import { CatalogFormDrawer, CatalogSectionHeader } from './CatalogFormDrawer';

type DocumentFormValues = {
  idDocumentoCredito: string;
  prioridad: string;
  aplicaA: string;
  obligatorio: boolean;
  requiereFirma: boolean;
  requiereValidacion: boolean;
};

type TemplateFormValues = {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipoDocumento: string;
  contenido: string;
};

type CreditOption = {
  id: number;
  consecutivo: string;
  nombreCliente: string;
};

type Props = {
  products: ProductoCreditoRow[];
  product?: ProductoCreditoRow;
  documents: ProductoDocumentoRow[];
  library: AddressCatalogItem[];
  value: DocumentFormValues;
  editing: boolean;
  busy: boolean;
  message: string;
  messageTone: FeedbackTone;
  onDismissMessage: () => void;
  onChange: (patch: Partial<DocumentFormValues>) => void;
  onSelectProduct: (id: number | null) => void;
  onEdit: (item: ProductoDocumentoRow) => void;
  onCancel: () => void;
  onDelete: (item: ProductoDocumentoRow) => void;
  onSave: (event: FormEvent) => Promise<boolean | undefined>;
  templates: DocumentTemplateRow[];
  selectedTemplate: DocumentTemplateDetail | null;
  templateForm: TemplateFormValues;
  credits: CreditOption[];
  documentCreditoId: string;
  documentVariables: DocumentVariable[];
  token: string | null;
  onNewTemplate: () => void;
  onSelectTemplate: (id: number) => void;
  onChangeTemplateForm: (patch: Partial<TemplateFormValues>) => void;
  onSaveTemplate: (event: FormEvent) => void;
  onPublishTemplate: () => void;
  onChangeDocumentCreditoId: (value: string) => void;
  onGenerateDocument: () => void;
  onTemplateMessage: (message: string) => void;
};

const aplicaOptions = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'CODEUDOR', label: 'Codeudor' },
  { value: 'EMPRESA', label: 'Empresa' },
  { value: 'VEHICULO', label: 'Vehículo' }
];

const tipoDocumentoOptions = [
  { value: 'PAGARE', label: 'Pagaré' },
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'AUTORIZACION', label: 'Autorización' },
  { value: 'FORMULARIO', label: 'Formulario' },
  { value: 'FIANZA', label: 'Fianza' }
];

const tipoOptions = [{ value: '', label: 'Todos los tipos' }, ...tipoDocumentoOptions];

export function ProductDocumentsView(props: Props) {
  const {
    products,
    product,
    documents,
    library,
    value,
    editing,
    busy,
    templates,
    selectedTemplate,
    templateForm,
    credits,
    documentCreditoId,
    documentVariables,
    token
  } = props;
  const [tab, setTab] = useState<'requisitos' | 'biblioteca' | 'plantillas'>('requisitos');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [aplica, setAplica] = useState('');
  const [flag, setFlag] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [librarySearch, setLibrarySearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateTipo, setTemplateTipo] = useState('');
  const [templateEstado, setTemplateEstado] = useState('');
  const [templateMode, setTemplateMode] = useState<'list' | 'editor'>('list');
  const [templatePage, setTemplatePage] = useState(1);
  const [templateSize, setTemplateSize] = useState(10);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return documents.filter((item) => {
      if (aplica && item.aplicaA !== aplica) return false;
      if (flag === 'obligatorio' && !item.obligatorio) return false;
      if (flag === 'firma' && !item.requiereFirma) return false;
      if (flag === 'validacion' && !item.requiereValidacion) return false;
      if (flag === 'opcional' && item.obligatorio) return false;
      if (!term) return true;
      return [item.documento, item.aplicaA].some((text) => (text || '').toLocaleLowerCase().includes(term));
    });
  }, [documents, search, aplica, flag]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * size, current * size);

  const libraryFiltered = useMemo(() => {
    const term = librarySearch.trim().toLocaleLowerCase();
    if (!term) return library;
    return library.filter((item) => item.nombre.toLocaleLowerCase().includes(term));
  }, [library, librarySearch]);

  const assignedIds = useMemo(() => {
    const names = new Set(documents.map((item) => item.documento.toLocaleLowerCase()));
    return new Set(library.filter((item) => names.has(item.nombre.toLocaleLowerCase())).map((item) => item.id));
  }, [documents, library]);

  const filteredTemplates = useMemo(() => {
    const term = templateSearch.trim().toLocaleLowerCase();
    return templates.filter((item) => {
      if (templateTipo && item.tipoDocumento !== templateTipo) return false;
      if (templateEstado && item.estado !== templateEstado) return false;
      if (!term) return true;
      return [item.nombre, item.codigo, item.tipoDocumento, item.estado].some((text) =>
        (text || '').toLocaleLowerCase().includes(term)
      );
    });
  }, [templates, templateSearch, templateTipo, templateEstado]);

  const templatePages = Math.max(1, Math.ceil(filteredTemplates.length / templateSize));
  const templateCurrent = Math.min(templatePage, templatePages);
  const visibleTemplates = filteredTemplates.slice((templateCurrent - 1) * templateSize, templateCurrent * templateSize);

  const templateMetrics = [
    { label: 'Plantillas', count: templates.length, color: 'blue' },
    { label: 'Publicadas', count: templates.filter((item) => item.estado === 'PUBLICADA' || item.estado === 'PUBLICADO').length, color: 'green' },
    { label: 'Borradores', count: templates.filter((item) => !['PUBLICADA', 'PUBLICADO'].includes(item.estado)).length, color: 'orange' }
  ];

  const openTemplateEditor = (id?: number) => {
    if (id) props.onSelectTemplate(id);
    else props.onNewTemplate();
    setTemplateMode('editor');
  };

  const backToTemplateList = () => {
    setTemplateMode('list');
  };

  const configurationTotal = product ? product.atributos + product.documentos + product.etapas : 0;
  const metrics = product
    ? [
        { label: 'Cargos', count: product.atributos, color: 'blue', Icon: FolderOpen, help: 'Atributos y cargos asignados al producto.' },
        { label: 'Documentos', count: product.documentos, color: 'green', Icon: FileText, help: 'Documentos configurados para el producto.' },
        { label: 'Etapas', count: product.etapas, color: 'purple', Icon: ShieldCheck, help: 'Etapas configuradas en el flujo del producto.' }
      ]
    : [];

  const close = () => {
    setOpen(false);
    props.onCancel();
  };

  const resetFilters = () => {
    setSearch('');
    setAplica('');
    setFlag('');
    setPage(1);
  };

  const resetTemplateFilters = () => {
    setTemplateSearch('');
    setTemplateTipo('');
    setTemplateEstado('');
    setTemplatePage(1);
  };

  const estadoClass = (estado: string) => {
    const value = estado.toLocaleUpperCase();
    if (value.includes('PUBLIC')) return 'aprobada';
    if (value.includes('RECHAZ') || value.includes('INACTIV')) return 'rechazada';
    return 'proceso';
  };

  const formatEstadoLabel = (estado: string) => {
    const value = estado.trim();
    if (!value) return value;
    return value.charAt(0).toLocaleUpperCase() + value.slice(1).toLocaleLowerCase();
  };

  const flagLabel = (item: ProductoDocumentoRow) => (
    <div className="documents-flag-tags">
      <span className={`requests-state ${item.obligatorio ? 'aprobada' : ''}`}>
        <i />
        {item.obligatorio ? 'Obligatorio' : 'Opcional'}
      </span>
      {item.requiereFirma && <span className="documents-mini-tag firma">Firma</span>}
      {item.requiereValidacion && <span className="documents-mini-tag validacion">Validación</span>}
    </div>
  );

  return (
    <section className="credit-requests-view product-conditions-view product-agreements-view product-documents-view">
      <section className="conditions-product-context">
        <span className="conditions-product-icon">
          <FileStack size={28} />
        </span>
        <div className="conditions-product-info">
          <small>PRODUCTO EN CONFIGURACIÓN</small>
          <h2>{product?.nombre || 'Selecciona un producto'}</h2>
          <p>{product?.consecutivo || 'Define los documentos requeridos y las plantillas del producto.'}</p>
        </div>
        <div className="conditions-product-selector">
          <SearchableDropdown
            label="Producto"
            value={product ? String(product.id) : ''}
            options={[
              { value: '', label: 'Seleccionar producto' },
              ...products.map((item) => ({
                value: String(item.id),
                label: `${item.consecutivo} - ${item.nombre} · v${item.version}`
              }))
            ]}
            onChange={(id) => {
              props.onSelectProduct(Number(id) || null);
              setPage(1);
            }}
          />
        </div>
        {product && (
          <div className="agreement-context-metrics">
            {metrics.map(({ label, count, color, Icon, help }) => (
              <article className={`agreement-metric ${color}`} key={label}>
                <div className="agreement-metric-top">
                  <span className="agreement-metric-icon">
                    <Icon size={20} />
                  </span>
                  <div className="agreement-metric-text">
                    <span className="agreement-metric-label">
                      {label}
                      <span
                        className="agreement-metric-help"
                        tabIndex={0}
                        title={`${help} La barra representa su proporción dentro de la configuración total.`}
                        aria-label={`${help} La barra representa su proporción dentro de la configuración total.`}
                      >
                        <Info size={11} />
                      </span>
                    </span>
                    <strong>{count}</strong>
                  </div>
                </div>
                <div className="agreement-metric-track" aria-hidden="true">
                  <span style={{ width: `${configurationTotal ? (count / configurationTotal) * 100 : 0}%` }} />
                </div>
                <small>
                  {count} {count === 1 ? 'configurado' : 'configurados'}
                </small>
              </article>
            ))}
          </div>
        )}
      </section>

      <nav className="catalog-view-tabs documents-view-tabs" aria-label="Secciones de documentación">
        <button type="button" className={tab === 'requisitos' ? 'selected' : ''} onClick={() => setTab('requisitos')}>
          <FileText size={14} />
          Requisitos del producto
          <em>{documents.length}</em>
        </button>
        <button type="button" className={tab === 'biblioteca' ? 'selected' : ''} onClick={() => setTab('biblioteca')}>
          <FolderOpen size={14} />
          Biblioteca documental
          <em>{library.length}</em>
        </button>
        <button type="button" className={tab === 'plantillas' ? 'selected' : ''} onClick={() => setTab('plantillas')}>
          <LayoutTemplate size={14} />
          Plantillas automáticas
          <em>{templates.length}</em>
        </button>
      </nav>

      {tab === 'requisitos' && (
        <section className="requests-list conditions-main-card">
          <header className="agreement-heading">
            <div>
              <small>REQUISITOS DOCUMENTALES</small>
              <h1>Documentos{product ? ` de ${product.nombre}` : ''}</h1>
              <p>Asigna documentos de la biblioteca y define prioridad, alcance, firma y validación.</p>
            </div>
            <button
              type="button"
              className="requests-button"
              disabled={!product || busy}
              onClick={() => {
                props.onCancel();
                props.onDismissMessage();
                setOpen(true);
              }}
            >
              <Plus size={16} />
              Asignar documento
            </button>
          </header>

          <div className="agreement-filters">
            <label className="requests-search">
              <Search size={16} />
              <input
                aria-label="Buscar documento"
                placeholder="Buscar por nombre o alcance…"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <SearchableDropdown
              label="Aplica a"
              value={aplica}
              options={[{ value: '', label: 'Todos' }, ...aplicaOptions]}
              onChange={(next) => {
                setAplica(next);
                setPage(1);
              }}
            />
            <SearchableDropdown
              label="Requisito"
              value={flag}
              options={[
                { value: '', label: 'Todos' },
                { value: 'obligatorio', label: 'Obligatorios' },
                { value: 'opcional', label: 'Opcionales' },
                { value: 'firma', label: 'Con firma' },
                { value: 'validacion', label: 'Con validación' }
              ]}
              onChange={(next) => {
                setFlag(next);
                setPage(1);
              }}
            />
            <button type="button" className="requests-button secondary" onClick={resetFilters}>
              <RotateCcw size={15} />
              Limpiar
            </button>
          </div>

          <div className="requests-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Documento</th>
                  <th>Prioridad</th>
                  <th>Aplica a</th>
                  <th>Requisitos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(current - 1) * size + index + 1}</td>
                    <td>
                      <div className="agreement-company">
                        <span>
                          <FileText size={17} />
                        </span>
                        <div>
                          <strong>{item.documento}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="documents-priority-chip">{item.prioridad}</span>
                    </td>
                    <td>
                      <span className={`catalog-base-tag ${item.aplicaA.toLocaleLowerCase()}`}>{item.aplicaA}</span>
                    </td>
                    <td>{flagLabel(item)}</td>
                    <td>
                      <div className="conditions-row-actions">
                        <button
                          type="button"
                          className="conditions-edit"
                          disabled={busy}
                          aria-label={`Editar ${item.documento}`}
                          onClick={() => {
                            props.onEdit(item);
                            props.onDismissMessage();
                            setOpen(true);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          className="conditions-delete"
                          disabled={busy}
                          aria-label={`Eliminar ${item.documento}`}
                          onClick={() => props.onDelete(item)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={6} className="requests-empty">
                      <FileText size={28} />
                      <strong>
                        {!product
                          ? 'Selecciona un producto para ver sus documentos'
                          : documents.length
                            ? 'No encontramos documentos con estos filtros'
                            : 'Este producto aún no tiene documentos asignados'}
                      </strong>
                      <p>{product ? 'Asigna un documento de la biblioteca o ajusta los filtros.' : 'Utiliza el selector de producto.'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="requests-pagination">
            <span>
              Mostrando {filtered.length ? (current - 1) * size + 1 : 0} a {Math.min(current * size, filtered.length)} de {filtered.length}{' '}
              resultados
            </span>
            <div>
              <button type="button" aria-label="Página anterior" disabled={current === 1} onClick={() => setPage(current - 1)}>
                <ChevronLeft size={15} />
              </button>
              <span className="requests-page">
                {current} / {pages}
              </span>
              <button type="button" aria-label="Página siguiente" disabled={current === pages} onClick={() => setPage(current + 1)}>
                <ChevronRight size={15} />
              </button>
              <select
                aria-label="Documentos por página"
                value={size}
                onChange={(event) => {
                  setSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </footer>
        </section>
      )}

      {tab === 'biblioteca' && (
        <section className="requests-list conditions-main-card documents-library-card">
          <header className="agreement-heading">
            <div>
              <small>CATÁLOGO MAESTRO</small>
              <h1>Biblioteca documental</h1>
              <p>Documentos reutilizables disponibles para asignar a cualquier producto de crédito.</p>
            </div>
            <button
              type="button"
              className="requests-button"
              disabled={!product || busy || !library.length}
              onClick={() => {
                setTab('requisitos');
                props.onCancel();
                props.onDismissMessage();
                setOpen(true);
              }}
            >
              <Plus size={16} />
              Asignar al producto
            </button>
          </header>

          <div className="agreement-filters">
            <label className="requests-search">
              <Search size={16} />
              <input
                aria-label="Buscar en biblioteca"
                placeholder="Buscar documento en la biblioteca…"
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
              />
            </label>
            <button type="button" className="requests-button secondary" onClick={() => setLibrarySearch('')}>
              <RotateCcw size={15} />
              Limpiar
            </button>
          </div>

          <div className="documents-library-grid">
            {libraryFiltered.map((item) => {
              const assigned = assignedIds.has(item.id);
              return (
                <article key={item.id} className={`documents-library-item ${assigned ? 'assigned' : ''}`}>
                  <span className="documents-library-icon">
                    <FileText size={18} />
                  </span>
                  <div>
                    <strong>{item.nombre}</strong>
                    <small>{assigned ? 'Ya asignado al producto actual' : 'Disponible para asignar'}</small>
                  </div>
                  {assigned ? (
                    <span className="requests-state aprobada">
                      <i />
                      Asignado
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="requests-button secondary"
                      disabled={!product || busy}
                      onClick={() => {
                        props.onCancel();
                        props.onChange({ idDocumentoCredito: String(item.id) });
                        props.onDismissMessage();
                        setTab('requisitos');
                        setOpen(true);
                      }}
                    >
                      Asignar
                    </button>
                  )}
                </article>
              );
            })}
            {!libraryFiltered.length && (
              <div className="requests-empty documents-library-empty">
                <FolderOpen size={28} />
                <strong>{library.length ? 'No hay coincidencias' : 'La biblioteca está vacía'}</strong>
                <p>{library.length ? 'Prueba con otro término de búsqueda.' : 'Carga documentos maestros desde el catálogo del sistema.'}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'plantillas' && templateMode === 'list' && (
        <section className="requests-list conditions-main-card documents-templates-card">
          <header className="agreement-heading">
            <div>
              <small>GENERACIÓN AUTOMÁTICA</small>
              <h1>Plantillas automáticas</h1>
              <p>Consulta y administra las plantillas. Abre una para editarla a ancho completo.</p>
            </div>
            <button type="button" className="requests-button" disabled={busy} onClick={() => openTemplateEditor()}>
              <Plus size={16} />
              Nueva plantilla
            </button>
          </header>

          <div className="documents-template-metrics">
            {templateMetrics.map((item) => (
              <article key={item.label} className={`documents-template-metric ${item.color}`}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </article>
            ))}
          </div>

          <div className="agreement-filters">
            <label className="requests-search">
              <Search size={16} />
              <input
                aria-label="Buscar plantilla"
                placeholder="Buscar por nombre, código o tipo…"
                value={templateSearch}
                onChange={(event) => {
                  setTemplateSearch(event.target.value);
                  setTemplatePage(1);
                }}
              />
            </label>
            <SearchableDropdown
              label="Tipo"
              value={templateTipo}
              options={tipoOptions}
              onChange={(value) => {
                setTemplateTipo(value);
                setTemplatePage(1);
              }}
            />
            <SearchableDropdown
              label="Estado"
              value={templateEstado}
              options={[
                { value: '', label: 'Todos' },
                ...Array.from(new Set(templates.map((item) => item.estado).filter(Boolean))).map((estado) => ({
                  value: estado,
                  label: formatEstadoLabel(estado)
                }))
              ]}
              onChange={(value) => {
                setTemplateEstado(value);
                setTemplatePage(1);
              }}
            />
            <button type="button" className="requests-button secondary" onClick={resetTemplateFilters}>
              <RotateCcw size={15} />
              Limpiar
            </button>
          </div>

          <div className="requests-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Plantilla</th>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleTemplates.map((template, index) => (
                  <tr key={template.id}>
                    <td>{(templateCurrent - 1) * templateSize + index + 1}</td>
                    <td>
                      <div className="agreement-company">
                        <span>
                          <LayoutTemplate size={17} />
                        </span>
                        <div>
                          <strong>{template.nombre}</strong>
                          {template.descripcion && <small>{template.descripcion}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="catalog-code">{template.codigo}</code>
                    </td>
                    <td>
                      <span className={`catalog-base-tag ${template.tipoDocumento.toLocaleLowerCase()}`}>{template.tipoDocumento}</span>
                    </td>
                    <td>v{template.ultimaVersion ?? 0}</td>
                    <td>
                      <span className={`requests-state ${estadoClass(template.estado)}`}>
                        <i />
                        {formatEstadoLabel(template.estado)}
                      </span>
                    </td>
                    <td>
                      <div className="conditions-row-actions">
                        <button
                          type="button"
                          className="conditions-edit"
                          disabled={busy}
                          aria-label={`Editar ${template.nombre}`}
                          onClick={() => openTemplateEditor(template.id)}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visibleTemplates.length && (
                  <tr>
                    <td colSpan={7} className="requests-empty">
                      <LayoutTemplate size={28} />
                      <strong>{templates.length ? 'No encontramos plantillas con estos filtros' : 'Aún no hay plantillas'}</strong>
                      <p>{templates.length ? 'Ajusta los filtros o limpia la búsqueda.' : 'Crea la primera plantilla automática.'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className="requests-pagination">
            <span>
              Mostrando {filteredTemplates.length ? (templateCurrent - 1) * templateSize + 1 : 0} a{' '}
              {Math.min(templateCurrent * templateSize, filteredTemplates.length)} de {filteredTemplates.length} resultados
            </span>
            <div>
              <button type="button" aria-label="Página anterior" disabled={templateCurrent === 1} onClick={() => setTemplatePage(templateCurrent - 1)}>
                <ChevronLeft size={15} />
              </button>
              <span className="requests-page">
                {templateCurrent} / {templatePages}
              </span>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={templateCurrent === templatePages}
                onClick={() => setTemplatePage(templateCurrent + 1)}
              >
                <ChevronRight size={15} />
              </button>
              <select
                aria-label="Plantillas por página"
                value={templateSize}
                onChange={(event) => {
                  setTemplateSize(Number(event.target.value));
                  setTemplatePage(1);
                }}
              >
                <option value={10}>10 por página</option>
                <option value={20}>20 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </footer>
        </section>
      )}

      {tab === 'plantillas' && templateMode === 'editor' && (
        <section className="requests-list conditions-main-card documents-templates-editor-view">
          <header className="documents-template-topbar">
            <div className="documents-template-topbar-left">
              <button type="button" className="requests-button secondary documents-template-back" onClick={backToTemplateList}>
                <ArrowLeft size={15} />
                Listado
              </button>
              <div className="documents-template-topbar-copy">
                <small>{selectedTemplate ? `Versión ${selectedTemplate.version ?? '—'}` : 'Nueva plantilla'}</small>
                <h1>{selectedTemplate ? selectedTemplate.nombre : 'Crear plantilla automática'}</h1>
                <p>
                  {selectedTemplate
                    ? `${selectedTemplate.codigo} · ${selectedTemplate.tipoDocumento} · ${formatEstadoLabel(selectedTemplate.estado)}`
                    : 'Define los datos base e inserta el contenido con campos automáticos.'}
                </p>
              </div>
            </div>
            <div className="documents-templates-editor-actions">
              <button type="submit" form="documents-template-form" className="requests-button" disabled={busy}>
                {selectedTemplate ? 'Guardar versión' : 'Crear plantilla'}
              </button>
              <button type="button" className="requests-button secondary" disabled={!selectedTemplate || busy} onClick={props.onPublishTemplate}>
                Publicar
              </button>
            </div>
          </header>

          <form id="documents-template-form" className="documents-template-workspace" onSubmit={props.onSaveTemplate}>
            <section className="documents-template-meta">
              <div className="documents-template-meta-head">
                <span>1</span>
                <div>
                  <strong>Datos de la plantilla</strong>
                  <p>Identificación y clasificación del documento.</p>
                </div>
              </div>
              <div className={`documents-template-meta-grid ${selectedTemplate ? 'editing' : ''}`}>
                <label className={`documents-float-field ${selectedTemplate ? 'is-disabled' : ''}`}>
                  <small>Código *</small>
                  <input
                    required
                    value={templateForm.codigo}
                    disabled={Boolean(selectedTemplate)}
                    onChange={(event) => props.onChangeTemplateForm({ codigo: event.target.value.toUpperCase() })}
                    placeholder="Ej. PAGARE_LIBRANZA"
                  />
                </label>
                <label className={`documents-float-field ${selectedTemplate ? 'is-disabled' : ''}`}>
                  <small>Nombre *</small>
                  <input
                    required
                    value={templateForm.nombre}
                    disabled={Boolean(selectedTemplate)}
                    onChange={(event) => props.onChangeTemplateForm({ nombre: event.target.value })}
                    placeholder="Nombre de la plantilla"
                  />
                </label>
                <SearchableDropdown
                  label="Tipo de documento"
                  value={templateForm.tipoDocumento}
                  disabled={Boolean(selectedTemplate)}
                  options={tipoDocumentoOptions}
                  onChange={(value) => props.onChangeTemplateForm({ tipoDocumento: value })}
                />
                {!selectedTemplate && (
                  <label className="documents-float-field documents-template-desc">
                    <small>Descripción</small>
                    <input
                      value={templateForm.descripcion}
                      onChange={(event) => props.onChangeTemplateForm({ descripcion: event.target.value })}
                      placeholder="Opcional"
                    />
                  </label>
                )}
              </div>
            </section>

            <section className="documents-template-content">
              <div className="documents-template-meta-head">
                <span>2</span>
                <div>
                  <strong>{selectedTemplate?.modoPlantilla === 'PDF_BASE' ? 'Mapeo del PDF' : 'Contenido del documento'}</strong>
                  <p>
                    {selectedTemplate?.modoPlantilla === 'PDF_BASE'
                      ? 'Ubica los campos sobre el formato institucional.'
                      : 'Edita el texto e inserta variables del crédito desde el panel derecho.'}
                  </p>
                </div>
              </div>

              {selectedTemplate?.modoPlantilla !== 'PDF_BASE' && (
                <RichDocumentEditor
                  value={templateForm.contenido}
                  variables={documentVariables}
                  onChange={(contenido) => props.onChangeTemplateForm({ contenido })}
                />
              )}

              {selectedTemplate?.modoPlantilla === 'PDF_BASE' && token && (
                <PdfFieldMapper token={token} templateId={selectedTemplate.id} variables={documentVariables} onMessage={props.onTemplateMessage} />
              )}
            </section>

            <footer className="documents-generate-bar">
              <SearchableDropdown
                label="Crédito para vista previa PDF"
                value={documentCreditoId}
                options={[
                  { value: '', label: 'Selecciona un crédito' },
                  ...credits.map((credito) => ({
                    value: String(credito.id),
                    label: `${credito.consecutivo} - ${credito.nombreCliente}`
                  }))
                ]}
                onChange={props.onChangeDocumentCreditoId}
              />
              <button
                type="button"
                className="requests-button"
                disabled={!selectedTemplate || !documentCreditoId || busy}
                onClick={props.onGenerateDocument}
              >
                Generar PDF
              </button>
            </footer>
          </form>
        </section>
      )}

      {open && (
        <CatalogFormDrawer
          kind="document"
          editing={editing}
          busy={busy}
          message={props.message}
          messageTone={props.messageTone}
          onDismissMessage={props.onDismissMessage}
          onClose={close}
          onSubmit={async (event) => {
            if (await props.onSave(event)) setOpen(false);
          }}
        >
          <CatalogSectionHeader title="Documento a asignar" description="Elige un documento de la biblioteca y su orden de prioridad." />
          <div className="request-drawer-grid two-cols">
            <div className="agreement-full">
              <SearchableDropdown
                label="Documento *"
                value={value.idDocumentoCredito}
                options={[
                  { value: '', label: 'Selecciona un documento' },
                  ...library.map((item) => ({ value: String(item.id), label: item.nombre }))
                ]}
                onChange={(next) => props.onChange({ idDocumentoCredito: next })}
              />
            </div>
            <label className="request-drawer-field">
              <span>Prioridad</span>
              <input type="number" min="1" value={value.prioridad} placeholder="1" onChange={(event) => props.onChange({ prioridad: event.target.value })} />
            </label>
            <SearchableDropdown
              label="Aplica a"
              value={value.aplicaA}
              options={aplicaOptions}
              onChange={(next) => props.onChange({ aplicaA: next })}
            />
          </div>

          <CatalogSectionHeader kind="additional" title="Requisitos del documento" description="Define si es obligatorio y si requiere firma o validación." />
          <div className="request-drawer-grid two-cols">
            <label className="edit-attribute-checkbox">
              <input type="checkbox" checked={value.obligatorio} onChange={(event) => props.onChange({ obligatorio: event.target.checked })} />
              <span>
                <strong>Obligatorio</strong>
                <small>Debe cargarse para avanzar en el expediente.</small>
              </span>
            </label>
            <label className="edit-attribute-checkbox">
              <input type="checkbox" checked={value.requiereFirma} onChange={(event) => props.onChange({ requiereFirma: event.target.checked })} />
              <span>
                <strong>Requiere firma</strong>
                <small>Activa el flujo de firma electrónica.</small>
              </span>
            </label>
            <label className="edit-attribute-checkbox agreement-full">
              <input
                type="checkbox"
                checked={value.requiereValidacion}
                onChange={(event) => props.onChange({ requiereValidacion: event.target.checked })}
              />
              <span>
                <strong>Requiere validación</strong>
                <small>Un analista debe aprobar el documento cargado.</small>
              </span>
            </label>
          </div>
        </CatalogFormDrawer>
      )}
    </section>
  );
}
