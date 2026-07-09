import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { CheckSquare, FileUp, Grip, Save, Signature, Type } from 'lucide-react';
import { api, type DocumentVariable, type PdfTemplateField } from './api';

GlobalWorkerOptions.workerSrc = workerUrl;

type Props = {
  token: string;
  templateId: number;
  variables: DocumentVariable[];
  onMessage: (message: string) => void;
};

export function PdfFieldMapper({ token, templateId, variables, onMessage }: Props) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [fields, setFields] = useState<PdfTemplateField[]>([]);
  const [selectedVariable, setSelectedVariable] = useState(variables[0]?.key ?? '');
  const [fieldType, setFieldType] = useState<PdfTemplateField['tipo']>('TEXTO');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedVariable((current) => current || variables[0]?.key || '');
  }, [variables]);

  useEffect(() => {
    void loadExisting();
  }, [templateId]);

  const loadExisting = async () => {
    try {
      const [buffer, savedFields] = await Promise.all([
        api.getTemplatePdfBase(token, templateId),
        api.listTemplatePdfFields(token, templateId)
      ]);
      const loaded = await getDocument({ data: buffer }).promise;
      setPdf(loaded);
      setFields(savedFields);
    } catch {
      setPdf(null);
      setFields([]);
    }
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      await api.uploadTemplatePdfBase(token, templateId, file);
      await loadExisting();
      onMessage('PDF base cargado. Ya puedes ubicar los campos.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'No se pudo cargar el PDF');
    } finally {
      setLoading(false);
    }
  };

  const addField = (event: MouseEvent<HTMLDivElement>, page: number) => {
    if (!selectedVariable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const variable = variables.find((item) => item.key === selectedVariable);
    setFields((current) => [...current, {
      variable: selectedVariable,
      etiqueta: variable?.label ?? selectedVariable,
      tipo: fieldType,
      pagina: page,
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      ancho: fieldType === 'FIRMA' ? 0.28 : 0.24,
      alto: fieldType === 'FIRMA' ? 0.08 : 0.035,
      tamanoFuente: 9
    }]);
  };

  const save = async () => {
    setLoading(true);
    try {
      setFields(await api.saveTemplatePdfFields(token, templateId, fields));
      onMessage('Mapa de campos guardado correctamente.');
    } catch (error) {
      onMessage(error instanceof Error ? error.message : 'No se pudieron guardar los campos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="pdf-mapper">
      <div className="pdf-mapper-toolbar">
        <label className="file-upload-button"><FileUp size={17} />{loading ? 'Cargando...' : 'Cargar PDF base'}<input type="file" accept="application/pdf" onChange={upload} /></label>
        <select value={selectedVariable} onChange={(event) => setSelectedVariable(event.target.value)}>
          {variables.map((variable) => <option key={variable.key} value={variable.key}>{variable.label}</option>)}
        </select>
        <div className="field-type-control">
          <button type="button" title="Texto" className={fieldType === 'TEXTO' ? 'active' : ''} onClick={() => setFieldType('TEXTO')}><Type size={17} /></button>
          <button type="button" title="Casilla" className={fieldType === 'CASILLA' ? 'active' : ''} onClick={() => setFieldType('CASILLA')}><CheckSquare size={17} /></button>
          <button type="button" title="Firma" className={fieldType === 'FIRMA' ? 'active' : ''} onClick={() => setFieldType('FIRMA')}><Signature size={17} /></button>
        </div>
        <button type="button" disabled={!pdf || loading} onClick={save}><Save size={17} /> Guardar campos</button>
      </div>
      {pdf ? (
        <div className="pdf-pages">
          {Array.from({ length: pdf.numPages }, (_, index) => (
            <PdfPage key={index + 1} pdf={pdf} pageNumber={index + 1} fields={fields.filter((field) => field.pagina === index + 1)} onAdd={addField} onDelete={(target) => setFields((current) => current.filter((field) => field !== target))} />
          ))}
        </div>
      ) : (
        <div className="empty-credit-state"><FileUp size={28} /><strong>Carga el formato PDF original</strong><span>Luego selecciona una variable y haz clic en la página para ubicarla.</span></div>
      )}
    </section>
  );
}

function PdfPage({ pdf, pageNumber, fields, onAdd, onDelete }: {
  pdf: PDFDocumentProxy; pageNumber: number; fields: PdfTemplateField[];
  onAdd: (event: MouseEvent<HTMLDivElement>, page: number) => void;
  onDelete: (field: PdfTemplateField) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void pdf.getPage(pageNumber).then(async (page) => {
      if (cancelled || !canvasRef.current) return;
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
    });
    return () => { cancelled = true; };
  }, [pdf, pageNumber]);

  return (
    <div className="pdf-page-wrap">
      <span>Pagina {pageNumber}</span>
      <div className="pdf-page-layer" onClick={(event) => onAdd(event, pageNumber)}>
        <canvas ref={canvasRef} />
        {fields.map((field, index) => (
          <button key={`${field.variable}-${index}`} type="button" className={`mapped-field ${field.tipo.toLowerCase()}`} style={{ left: `${field.x * 100}%`, top: `${field.y * 100}%`, width: `${field.ancho * 100}%`, height: `${field.alto * 100}%` }} title="Doble clic para eliminar" onDoubleClick={(event) => { event.stopPropagation(); onDelete(field); }}>
            <Grip size={12} /> {field.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
