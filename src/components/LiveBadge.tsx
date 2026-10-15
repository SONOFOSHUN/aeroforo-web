export function LiveBadge({ paused }: { paused: boolean }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-faint" : "live-dot bg-green"}`} />
      {paused ? "En pausa" : "En vivo"}
    </span>
  );
}
