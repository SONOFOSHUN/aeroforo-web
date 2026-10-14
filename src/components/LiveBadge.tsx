export function LiveBadge({ paused }: { paused: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
      <span className={`relative h-2 w-2 rounded-full ${paused ? "bg-muted" : "pulse-ring bg-green text-green"}`} />
      {paused ? "En pausa" : "En vivo"}
    </span>
  );
}
