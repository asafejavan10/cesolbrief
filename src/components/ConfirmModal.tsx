import { AlertTriangle } from 'lucide-react';

export function ConfirmModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/35 px-4 backdrop-blur-sm">
      <div className="panel max-w-md p-6">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-700">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-black text-stone-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn-secondary" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="btn-primary bg-red-700 hover:bg-red-800" onClick={onConfirm} type="button">
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
