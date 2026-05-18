export function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-2xl bg-stone-200" />
      ))}
    </div>
  );
}
