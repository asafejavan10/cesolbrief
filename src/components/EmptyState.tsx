import { Inbox } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-stone-100 text-stone-500">
        <Inbox size={24} />
      </div>
      <h3 className="mt-4 text-lg font-black text-stone-950">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
