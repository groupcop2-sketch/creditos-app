import React, { useEffect, useRef, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';

type ViewerDoc = { url: string; name: string; type: string };
const EVENT = 'open-document-viewer';

const EXT_BY_TYPE: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

/** Opens any document blob in the app's viewer modal (preview + download) instead of a new tab. */
export function openDocument(blob: Blob, name = 'documento') {
  const fileName = /\.[a-z0-9]{2,5}$/i.test(name) ? name : `${name}${EXT_BY_TYPE[blob.type] ?? ''}`;
  window.dispatchEvent(new CustomEvent<ViewerDoc>(EVENT, { detail: { url: URL.createObjectURL(blob), name: fileName, type: blob.type } }));
}

/** Mount once at the app root. */
export const DocumentViewerHost: React.FC = () => {
  const [doc, setDoc] = useState<ViewerDoc | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = (event: Event) => {
      setDoc((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return (event as CustomEvent<ViewerDoc>).detail;
      });
    };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  const close = () => setDoc((prev) => {
    if (prev) URL.revokeObjectURL(prev.url);
    return null;
  });

  useEffect(() => {
    if (!doc) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [doc]);

  if (!doc) return null;
  const isPdf = doc.type === 'application/pdf';
  const isImage = doc.type.startsWith('image/');

  return (
    <div className="doc-viewer-backdrop" onClick={close}>
      <div className="doc-viewer" role="dialog" aria-modal="true" aria-labelledby="doc-viewer-title" onClick={(e) => e.stopPropagation()}>
        <header className="doc-viewer-header">
          <FileText size={18} aria-hidden="true" />
          <h2 id="doc-viewer-title" title={doc.name}>{doc.name}</h2>
          <a className="doc-viewer-btn primary" href={doc.url} download={doc.name}>
            <Download size={16} aria-hidden="true" /> Descargar
          </a>
          <button ref={closeRef} type="button" className="doc-viewer-btn icon" onClick={close} aria-label="Cerrar visor">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="doc-viewer-body">
          {isPdf && <iframe title={doc.name} src={doc.url} />}
          {isImage && <img src={doc.url} alt={doc.name} />}
          {!isPdf && !isImage && (
            <div className="doc-viewer-empty">
              <FileText size={40} aria-hidden="true" />
              <p>Este tipo de archivo no tiene vista previa.</p>
              <a className="doc-viewer-btn primary" href={doc.url} download={doc.name}><Download size={16} aria-hidden="true" /> Descargar archivo</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
