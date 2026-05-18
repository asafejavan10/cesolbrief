import { CheckCircle2, CircleDot, Clock3 } from 'lucide-react';
import { BriefingStatus } from '../types';
import { cn } from '../utils/cn';

const map = {
  novo: { label: 'Novo', icon: CircleDot, className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  em_andamento: { label: 'Em andamento', icon: Clock3, className: 'bg-blue-50 text-blue-800 ring-blue-200' },
  concluido: { label: 'Concluído', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
};

export function StatusBadge({ status }: { status: BriefingStatus }) {
  const item = map[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1', item.className)}>
      <item.icon size={14} />
      {item.label}
    </span>
  );
}
