import React, { useEffect, useRef, useState } from 'react';
import { Eye, FolderPlus, Upload } from 'lucide-react';
import { api, type DocumentoAdicionalRow } from '../../api';
import { openDocument } from '../DocumentViewer';

type Props = {
  token: string;
  creditoId: number;
  readOnly?: boolean;
  formatDateTime: (val?: string | null) => string;
};

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx';
const kb = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Extra documents of the credit, stored in the same bucket folder as the client's files. */
export const DocumentosAdicionalesPanel: React.FC<Props> = ({ token, creditoId, readOnly = false, formatDateTime }) => {
  const [docs, setDocs] = useState<DocumentoAdicionalRow[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.listDocumentosAdicionales(token, creditoId).then(setDocs).catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los documentos'));
  }, [token, creditoId]);

  const subir = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      setDocs(await api.subirDocumentoAdicional(token, creditoId, descripcion.trim() || file.name, file));
      setDescripcion('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el documento');
    } finally {
      setBusy(false);
    }
  };

  const ver = async (doc: DocumentoAdicionalRow) => {
    try {
      openDocument(await api.getDocumentoAdicionalArchivo(token, doc.id), doc.nombreArchivo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el documento');
    }
  };

  return (
    <section className="estudio-panel" aria-labelledby="adicionales-title">
      <header className="estudio-header">
        <div>
          <h3 id="adicionales-title"><FolderPlus size={18} aria-hidden="true" /> Documentos adicionales del crédito</h3>
          <p>Soportes extra (extractos, certificados, paz y salvos…). Se guardan en la carpeta del crédito en el bucket, junto con los documentos del cliente.</p>
        </div>
      </header>

      {!readOnly && (
        <div className="adicional-form">
          <input className="visacion-input" placeholder="Descripción (ej. Extracto bancario marzo)" aria-label="Descripción del documento" value={descripcion} maxLength={200} onChange={(e) => setDescripcion(e.target.value)} />
          <label className={`compra-file adicional-file ${file ? 'has-file' : ''}`}>
            <input ref={fileRef} type="file" accept={ACCEPT} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <span>{file ? `${file.name} · ${kb(file.size)}` : 'Seleccionar archivo (PDF, imagen, Word o Excel · máx. 15 MB)'}</span>
          </label>
          <button type="button" className="stage-btn-primary" disabled={busy || !file || file.size > 15 * 1024 * 1024} onClick={subir}>
            <Upload size={14} aria-hidden="true" /> {busy ? 'Cargando…' : 'Cargar'}
          </button>
        </div>
      )}
      {error && <p className="estudio-error" role="alert">{error}</p>}

      {docs.length === 0 ? (
        <p className="muted-note">No hay documentos adicionales en este crédito.</p>
      ) : (
        <div className="estudio-history">
          <ul>
            {docs.map((doc) => (
              <li key={doc.id}>
                <span className={`chip ${doc.almacenamiento === 'AWS_S3' ? 'ok' : 'warn'}`}>{doc.almacenamiento === 'AWS_S3' ? 'Bucket S3' : 'Base de datos'}</span>
                <span><strong>{doc.descripcion}</strong> · {doc.nombreArchivo} · {kb(doc.tamanoBytes)}</span>
                <button type="button" className="doc-action-btn" onClick={() => ver(doc)}><Eye size={14} aria-hidden="true" /> Ver</button>
                <small>{formatDateTime(doc.fecha)}{doc.usuario ? ` · ${doc.usuario}` : ''}{doc.rutaBucket ? ` · ${doc.rutaBucket}` : ''}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
