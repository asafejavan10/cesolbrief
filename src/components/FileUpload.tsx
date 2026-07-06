import { FileText, Image, Paperclip, Trash2, UploadCloud } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { formatBytes } from '../utils/format';
import { cn } from '../utils/cn';
import { MAX_ATTACHMENTS, validateAttachments } from '../utils/fileRules';

export function FileUpload({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const next = [...files, ...Array.from(incoming)];
      const error = validateAttachments(next);
      if (error) {
        toast.error(error);
        return;
      }
      onChange(next);
      if (incoming.length) toast.success(`${incoming.length} arquivo(s) adicionados.`);
    },
    [files, onChange],
  );

  return (
    <div>
      <label
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white px-6 py-10 text-center transition',
          dragging ? 'border-cesol-500 bg-cesol-50' : 'border-stone-250 hover:border-cesol-300 hover:bg-cesol-50/40',
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <input
          className="sr-only"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={(event) => event.target.files && addFiles(event.target.files)}
        />
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cesol-100 text-cesol-800">
          <UploadCloud size={28} />
        </div>
        <p className="mt-4 text-lg font-black text-stone-950">Arraste arquivos ou clique para enviar</p>
        <p className="mt-2 text-sm text-stone-500">Imagens, PDFs e documentos. Até {MAX_ATTACHMENTS} anexos (máx. 2 MB para imagens/docs, 5 MB para PDF).</p>
      </label>

      {files.length > 0 && (
        <div className="mt-5 space-y-3">
          {files.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            return (
              <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-stone-100 text-cesol-800">
                  {isImage ? <Image size={20} /> : file.type.includes('pdf') ? <FileText size={20} /> : <Paperclip size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-stone-900">{file.name}</p>
                  <p className="text-xs text-stone-500">{formatBytes(file.size)}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-stone-100">
                    <div className="h-full w-full rounded-full bg-cesol-500" />
                  </div>
                </div>
                <button className="rounded-xl p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-700" onClick={() => onChange(files.filter((_, itemIndex) => itemIndex !== index))} type="button">
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
