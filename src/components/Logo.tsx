import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cesol-700 text-white shadow-card">
        <Sparkles size={20} />
      </div>
      <div>
        <strong className="block text-lg leading-none text-stone-900">CesolBrief</strong>
        <span className="text-xs font-medium text-stone-500">Briefings criativos</span>
      </div>
    </div>
  );
}
