export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-stone-200">
      <div className="h-full rounded-full bg-gradient-to-r from-cesol-700 to-amber-400 transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}
