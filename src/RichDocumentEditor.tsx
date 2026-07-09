import { useEffect, useState, type ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Eye, Heading1, Heading2,
  Italic, List, ListOrdered, Minus, Pilcrow, Redo2, Table2, UnderlineIcon, Undo2
} from 'lucide-react';
import type { DocumentVariable } from './api';

type Props = {
  value: string;
  variables: DocumentVariable[];
  onChange: (value: string) => void;
};

export function RichDocumentEditor({ value, variables, onChange }: Props) {
  const [mode, setMode] = useState<'editor' | 'preview'>('editor');
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: normalizeContent(value),
    onUpdate: ({ editor: current }) => onChange(current.getHTML())
  });

  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeContent(value);
    if (editor.getHTML() !== normalized) editor.commands.setContent(normalized, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const tool = (label: string, active: boolean, action: () => void, icon: ReactNode) => (
    <button type="button" className={active ? 'active' : ''} title={label} aria-label={label} onClick={action}>{icon}</button>
  );

  return (
    <div className="rich-document-editor">
      <div className="document-editor-modes">
        <button type="button" className={mode === 'editor' ? 'active' : ''} onClick={() => setMode('editor')}><Pilcrow size={16} /> Editar</button>
        <button type="button" className={mode === 'preview' ? 'active' : ''} onClick={() => setMode('preview')}><Eye size={16} /> Vista previa</button>
      </div>
      {mode === 'editor' ? (
        <>
          <div className="document-editor-toolbar">
            {tool('Deshacer', false, () => editor.chain().focus().undo().run(), <Undo2 size={17} />)}
            {tool('Rehacer', false, () => editor.chain().focus().redo().run(), <Redo2 size={17} />)}
            <span />
            {tool('Titulo principal', editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <Heading1 size={17} />)}
            {tool('Subtitulo', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={17} />)}
            {tool('Negrita', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold size={17} />)}
            {tool('Cursiva', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic size={17} />)}
            {tool('Subrayado', editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={17} />)}
            <span />
            {tool('Alinear izquierda', editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft size={17} />)}
            {tool('Centrar', editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter size={17} />)}
            {tool('Alinear derecha', editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight size={17} />)}
            {tool('Justificar', editor.isActive({ textAlign: 'justify' }), () => editor.chain().focus().setTextAlign('justify').run(), <AlignJustify size={17} />)}
            <span />
            {tool('Lista', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List size={17} />)}
            {tool('Lista numerada', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={17} />)}
            {tool('Insertar tabla', editor.isActive('table'), () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), <Table2 size={17} />)}
            {tool('Salto de pagina', false, () => editor.chain().focus().setHorizontalRule().run(), <Minus size={17} />)}
          </div>
          <div className="document-editor-body">
            <EditorContent editor={editor} />
            <aside className="variable-palette">
              <strong>Campos automaticos</strong>
              <p>Inserta datos del crédito en la posición del cursor.</p>
              {variables.map((variable) => (
                <button key={variable.key} type="button" onClick={() => editor.chain().focus().insertContent(`{{${variable.key}}}`).run()}>
                  <span>{variable.label}</span><code>{`{{${variable.key}}}`}</code>
                </button>
              ))}
            </aside>
          </div>
        </>
      ) : (
        <div className="document-preview-stage">
          <article className="document-paper" dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
        </div>
      )}
    </div>
  );
}

function normalizeContent(value: string) {
  if (!value) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\r?\n\r?\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\r?\n/g, '<br>')}</p>`)
    .join('');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
