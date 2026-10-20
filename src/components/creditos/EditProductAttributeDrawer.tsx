import { useEffect, useId, useRef, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Info, Package, X } from 'lucide-react';
import { FeedbackAlert, type FeedbackTone } from '../../FeedbackAlert';
import { CatalogSectionHeader } from './CatalogFormDrawer';
import type { FormulaCalculoRow } from '../../api';

export type ProductAttributeValues = {
  tipoLimite?: 'MONTO' | 'EDAD';
  idTipoAtributo: string;
  idTipoCalculo: string;
  operacion?: string;
  nombre?: string;
  valor: string;
  porcentaje: string;
  valor2: string;
  minimo: string;
  maximo: string;
  aplicaIva: boolean;
  obligatorio: boolean;
  proveedor?: string;
  prioridad?: string;
};

type Props = {
  name: string;
  description: string;
  type: string;
  value: ProductAttributeValues;
  tiposAtributo?: { id: number; nombre: string }[];
  tiposCalculo?: FormulaCalculoRow[];
  customFormulas?: string[];
  busy: boolean;
  message: string;
  messageTone: FeedbackTone;
  onDismissMessage: () => void;
  onChange: (patch: Partial<ProductAttributeValues>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export function EditProductAttributeDrawer({
  name,
  description,
  type,
  value,
  tiposAtributo = [],
  tiposCalculo = [],
  customFormulas = [],
  busy,
  message,
  messageTone,
  onDismissMessage,
  onChange,
  onClose,
  onSubmit
}: Props) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onClose();
      }
      if (event.key === 'Tab') {
        const controls = Array.from(
          panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)') ?? []
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (!first) {
          event.preventDefault();
          panel.current?.focus();
          return;
        }
        if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [busy, onClose]);

  const normalizeOperacionUi = (raw?: string) => {
    const op = (raw || '').trim();
    if (op === 'Porcentaje' || op === 'Valor fijo' || op === 'Manual' || op === 'Formula') return op;
    if (
      op === 'Formula' ||
      op === 'Base * valor / valor2' ||
      op === '(base / valor1) × valor2' ||
      op === 'Valor × plazo' ||
      op.toUpperCase().includes('BASE') ||
      op.toUpperCase().includes('VALOR2') ||
      op.toUpperCase().includes('PLAZO')
    ) return 'Formula';
    if (op.toUpperCase().includes('MANUAL')) return 'Manual';
    if (op.toUpperCase().includes('FIJO') || (Number(value.valor) > 0 && !Number(value.porcentaje))) return 'Valor fijo';
    return 'Porcentaje';
  };

  const currentOperacion = normalizeOperacionUi(
    value.operacion || (Number(value.valor) > 0 && !Number(value.porcentaje) ? 'Valor fijo' : 'Porcentaje')
  );

  const handleFormulaChange = (selectedVal: string) => {
    let resolvedId = selectedVal;
    let selectedFormula = tiposCalculo.find((tc) => String(tc.id) === selectedVal);
    if (!selectedFormula) {
      selectedFormula = tiposCalculo.find(
        (tc) => tc.nombre.trim().toUpperCase() === selectedVal.trim().toUpperCase() ||
                (tc.codigo && tc.codigo.trim().toUpperCase() === selectedVal.trim().toUpperCase())
      );
      if (selectedFormula) {
        resolvedId = String(selectedFormula.id);
      }
    }

    if (!selectedFormula && tiposCalculo.length > 0) {
      const upper = selectedVal.trim().toUpperCase();
      if (upper.includes('BASE_DIV') || (upper.includes('VALOR1') && upper.includes('VALOR2'))) {
        selectedFormula = tiposCalculo.find((tc) => tc.operacion === 'BASE_DIV_VALOR_MUL_VALOR2') || tiposCalculo[0];
      } else if (upper.includes('/') || upper.includes('VALOR2') || upper.includes('DIV')) {
        selectedFormula = tiposCalculo.find((tc) => tc.operacion === 'BASE_POR_VALOR_DIV_VALOR2' || tc.nombre.toUpperCase().includes('VALOR2')) || tiposCalculo[0];
      } else if (upper.includes('FIJO') || upper.includes('VALOR *')) {
        selectedFormula = tiposCalculo.find((tc) => tc.nombre.toUpperCase().includes('VALOR FIJO')) || tiposCalculo[0];
      } else if (upper.includes('MANUAL')) {
        selectedFormula = tiposCalculo.find((tc) => tc.nombre.toUpperCase().includes('MANUAL')) || tiposCalculo[0];
      } else if (upper.includes('CUOTA')) {
        selectedFormula = tiposCalculo.find((tc) => tc.nombre.toUpperCase().includes('CUOTA')) || tiposCalculo[0];
      } else if (upper.includes('SALDO')) {
        selectedFormula = tiposCalculo.find((tc) => tc.nombre.toUpperCase().includes('SALDO')) || tiposCalculo[0];
      } else if (upper.includes('%') || upper.includes('PORCENTAJE')) {
        selectedFormula = tiposCalculo.find((tc) => tc.nombre.toUpperCase().includes('PORCENTAJE')) || tiposCalculo[0];
      }
      if (!selectedFormula) selectedFormula = tiposCalculo[0];
      if (selectedFormula) resolvedId = String(selectedFormula.id);
    }

    const formulaName = (selectedFormula?.nombre || selectedVal).toUpperCase();
    const formulaOp = (selectedFormula?.operacion || '').toUpperCase();
    let autoOp = currentOperacion;
    const expr = (selectedFormula?.expresion || '').toUpperCase();
    if (
      formulaOp === 'PERSONALIZADA' ||
      Boolean(expr) ||
      formulaOp.includes('BASE_') ||
      formulaOp.includes('VALOR2') ||
      formulaOp.includes('POR_PLAZO') ||
      formulaName.includes('/') ||
      formulaName.includes('VALOR2') ||
      formulaName.includes('PLAZO') ||
      formulaName.includes('SEGURO DE VIDA')
    ) {
      autoOp = 'Formula';
    } else if (formulaOp === 'VALOR_FIJO' || formulaName.includes('VALOR FIJO')) {
      autoOp = 'Valor fijo';
    } else if (formulaName.includes('MANUAL')) {
      autoOp = 'Manual';
    } else if (formulaOp === 'PORCENTAJE' || formulaOp === 'PORCENTAJE_POR_PLAZO' || formulaName.includes('%') || formulaName.includes('PORCENTAJE') || formulaName.includes('FIANZA')) {
      autoOp = 'Porcentaje';
    }

    let patch: Partial<ProductAttributeValues> = {
      idTipoCalculo: resolvedId,
      operacion: autoOp
    };

    if (selectedFormula?.baseCalculo) {
      const matchTipo = tiposAtributo.find((ta) => ta.nombre.toUpperCase() === selectedFormula.baseCalculo.toUpperCase());
      if (matchTipo) {
        patch.idTipoAtributo = String(matchTipo.id);
      }
    }

    onChange(patch);
  };

  const handleOperacionChange = (newOp: string) => {
    onChange({
      operacion: newOp,
      ...(newOp === 'Porcentaje' ? { valor: '', valor2: '' } : {}),
      ...(newOp === 'Valor fijo' || newOp === 'Manual' ? { porcentaje: '', valor2: '' } : {}),
      ...(newOp === 'Formula' ? { porcentaje: '' } : {})
    });
  };


  const needsValorSolo = currentOperacion === 'Valor fijo' || currentOperacion === 'Manual';

  const currentTypeName = tiposAtributo.find((ta) => String(ta.id) === String(value.idTipoAtributo))?.nombre || type || '—';

  const selectedTipoCalculoId = (() => {
    if (value.idTipoCalculo && tiposCalculo.some((tc) => String(tc.id) === String(value.idTipoCalculo))) {
      return String(value.idTipoCalculo);
    }
    const matched = tiposCalculo.find(
      (tc) => tc.nombre.trim().toUpperCase() === String(value.idTipoCalculo || '').trim().toUpperCase() ||
              (tc.codigo && tc.codigo.trim().toUpperCase() === String(value.idTipoCalculo || '').trim().toUpperCase())
    );
    if (matched) return String(matched.id);
    return value.idTipoCalculo || '';
  })();

  return createPortal(
    <div
      className="request-drawer-overlay"
      onClick={(event) => {
        if (event.currentTarget === event.target && !busy) onClose();
      }}
    >
      <div
        className="request-drawer edit-attribute-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        ref={panel}
        tabIndex={-1}
      >
        <header className="request-drawer-heading">
          <div>
            <h2 id={`${id}-title`}>Editar atributo</h2>
            <p>Modifica la configuración del atributo asignado al producto.</p>
          </div>
          <button
            ref={close}
            type="button"
            className="request-drawer-close"
            aria-label="Cerrar edición de atributo"
            disabled={busy}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <form className="request-drawer-form" onSubmit={onSubmit}>
          <div className="request-drawer-content">
            <FeedbackAlert message={message} tone={messageTone} onDismiss={onDismissMessage} />
            <section className="edit-attribute-summary">
              <span className="send-drawer-heading-icon">
                <Package size={22} />
              </span>
              <div>
                <h3>{name}</h3>
                <p>{description || 'Atributo asignado al producto.'}</p>
              </div>
              <div className="edit-attribute-type">
                <small>Tipo</small>
                <b>{currentTypeName}</b>
              </div>
            </section>

            <fieldset disabled={busy}>
              <CatalogSectionHeader
                title="Configuración de cálculo"
                description="Define cómo se calcula el valor del atributo."
                kind="calculation"
              />

              <div className="field-grid catalog-three-cols">
                <label className="product-field">
                  <span>Aplica a (Base) *</span>
                  <select
                    value={value.idTipoAtributo}
                    onChange={(event) => onChange({ idTipoAtributo: event.target.value })}
                  >
                    {(tiposAtributo.length > 0
                      ? tiposAtributo
                      : [
                          { id: 1, nombre: 'CRÉDITO' },
                          { id: 2, nombre: 'CUOTA' },
                          { id: 3, nombre: 'DESEMBOLSO' }
                        ]
                    ).map((ta) => (
                      <option key={ta.id} value={String(ta.id)}>
                        {ta.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="product-field">
                  <span>Tipo de fórmula *</span>
                  <select
                    value={selectedTipoCalculoId}
                    onChange={(event) => handleFormulaChange(event.target.value)}
                  >
                    <option value="">-- Seleccionar Tipo de Fórmula --</option>
                    {tiposCalculo.map((tc) => (
                      <option key={tc.id} value={String(tc.id)}>
                        {tc.nombre} ({tc.baseCalculo || 'CRÉDITO'})
                      </option>
                    ))}
                    {customFormulas
                      .filter((cf) => !tiposCalculo.some((tc) => tc.nombre.trim().toUpperCase() === cf.trim().toUpperCase()))
                      .map((formula, idx) => {
                        const matchedTc = tiposCalculo.find(
                          (tc) => tc.nombre.trim().toUpperCase() === formula.trim().toUpperCase() ||
                                  (tc.codigo && tc.codigo.trim().toUpperCase() === formula.trim().toUpperCase())
                        );
                        return (
                          <option key={`cf-${idx}`} value={matchedTc ? String(matchedTc.id) : formula}>
                            {formula}
                          </option>
                        );
                      })}
                  </select>
                </label>

                <label className="product-field">
                  <span>Operación por defecto *</span>
                  <select
                    value={currentOperacion}
                    onChange={(event) => handleOperacionChange(event.target.value)}
                  >
                    <option value="Porcentaje">Porcentaje</option>
                    <option value="Valor fijo">Valor fijo</option>
                    <option value="Manual">Manual</option>
                    <option value="Formula">Formula</option>
                  </select>
                </label>

                {currentOperacion === 'Porcentaje' && (
                  <label className="product-field">
                    <span>Porcentaje (%) *</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={value.porcentaje}
                      placeholder="Ej. 10.0"
                      onChange={(event) => onChange({ porcentaje: event.target.value, valor: '' })}
                    />
                  </label>
                )}

                {needsValorSolo && (
                  <label className="product-field">
                    <span>Valor ($) *</span>
                    <div className="attribute-value-input">
                      <span>$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={value.valor}
                        placeholder="Ej. 15000"
                        onChange={(event) => onChange({ valor: event.target.value, porcentaje: '' })}
                      />
                    </div>
                  </label>
                )}

                {currentOperacion === 'Formula' && (() => {
                  const formula = tiposCalculo.find(item => String(item.id) === value.idTipoCalculo);
                  return <>
                    {formula?.requiereValor && <label className="product-field"><span>Valor 1 (parametro) *</span><input type="number" min="0" step="any" value={value.valor} onChange={event => onChange({valor: event.target.value})} /></label>}
                    {formula?.requiereValor2 && <label className="product-field"><span>Valor 2 (parametro) *</span><input type="number" min="0" step="any" value={value.valor2} onChange={event => onChange({valor2: event.target.value})} /></label>}
                    {formula?.requierePorcentaje && <label className="product-field"><span>Porcentaje (parametro) *</span><input type="number" min="0" step="any" value={value.porcentaje} onChange={event => onChange({porcentaje: event.target.value})} /></label>}
                    <p>{formula?.expresion || formula?.nombre || 'Selecciona una formula del catalogo.'}</p>
                  </>;
                })()}

                <label className="product-field"><span>Estos limites corresponden a</span>
                  <select value={value.tipoLimite ?? 'MONTO'} onChange={event => onChange({tipoLimite: event.target.value as 'MONTO' | 'EDAD'})}>
                    <option value="MONTO">Monto del cargo (pesos)</option><option value="EDAD">Edad del solicitante (anios)</option>
                  </select>
                </label>
                <label className="product-field">
                  <span>{value.tipoLimite === 'EDAD' ? 'Edad minima' : 'Valor minimo'}</span>
                  <div className="attribute-value-input">
                    <span>{value.tipoLimite === 'EDAD' ? 'Edad' : '$'}</span>
                    <input
                      type="number"
                      step="any"
                      value={value.minimo}
                      placeholder="0"
                      onChange={(event) => onChange({ minimo: event.target.value })}
                    />
                  </div>
                </label>

                <label className="product-field">
                  <span>{value.tipoLimite === 'EDAD' ? 'Edad maxima' : 'Valor maximo'}</span>
                  <div className="attribute-value-input">
                    <span>{value.tipoLimite === 'EDAD' ? 'Edad' : '$'}</span>
                    <input
                      type="number"
                      step="any"
                      value={value.maximo}
                      placeholder="0"
                      onChange={(event) => onChange({ maximo: event.target.value })}
                    />
                  </div>
                </label>
              </div>

              <section className="edit-attribute-section">
                <h3>Opciones adicionales</h3>
                <label className="edit-attribute-checkbox">
                  <input
                    type="checkbox"
                    checked={value.aplicaIva}
                    onChange={(event) => onChange({ aplicaIva: event.target.checked })}
                  />
                  <span>
                    <strong>Aplica IVA</strong>
                    <small>Indica si este atributo genera IVA.</small>
                  </span>
                </label>
                <label className="edit-attribute-checkbox">
                  <input
                    type="checkbox"
                    checked={value.obligatorio}
                    onChange={(event) => onChange({ obligatorio: event.target.checked })}
                  />
                  <span>
                    <strong>Obligatorio</strong>
                    <small>El atributo es obligatorio para el producto.</small>
                  </span>
                </label>
              </section>
            </fieldset>

            <p className="request-drawer-notice">
              <Info size={20} />
              <span>
                <strong>Estos valores se aplicarán únicamente al producto</strong>
                <br />
                La configuración del atributo en el catálogo no se verá afectada.
              </span>
            </p>

            <FeedbackAlert message={message} tone={messageTone} onDismiss={onDismissMessage} />
          </div>

          <footer className="request-drawer-footer">
            <button
              type="button"
              className="requests-button secondary"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="requests-button" disabled={busy}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}
