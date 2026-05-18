import { LucideIcon } from 'lucide-react';

export function MetricCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: LucideIcon; tone: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-stone-950">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
