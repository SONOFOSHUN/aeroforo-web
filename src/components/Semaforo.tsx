import { LEVELS, LEVEL_ORDER } from "@/lib/air";
import type { Level } from "@/lib/types";

/** Cabezal del Aeróforo: carcasa grafito con tres luces; la activa se enciende según el nivel. */
export function Semaforo({ level, size = "md" }: { level: Level | null; size?: "xs" | "sm" | "md" | "lg" }) {
  const dim = { xs: "h-2.5 w-2.5", sm: "h-4 w-4", md: "h-11 w-11", lg: "h-14 w-14 sm:h-[72px] sm:w-[72px]" }[size];
  const pad = {
    xs: "gap-[3px] p-1 rounded-full",
    sm: "gap-1 p-1.5 rounded-full",
    md: "gap-2.5 p-2.5 rounded-[26px]",
    lg: "gap-3 p-3 rounded-[34px] sm:gap-3.5 sm:p-3.5 sm:rounded-[44px]",
  }[size];
  return (
    <div
      role="img"
      aria-label={level ? `Semáforo en ${LEVELS[level].label}` : "Semáforo sin datos"}
      className={`flex shrink-0 flex-col bg-[#15181d] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(0,0,0,0.5)] ${pad}`}
    >
      {[...LEVEL_ORDER].reverse().map((l) => {
        const on = l === level;
        const c = LEVELS[l].color;
        return (
          <span
            key={l}
            className={`${dim} rounded-full`}
            style={{
              background: on ? `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55), ${c} 42%)` : `${c}26`,
              boxShadow: on ? `0 0 18px 2px ${c}80` : "inset 0 1px 3px rgba(0,0,0,0.6)",
              transition: "background 500ms var(--ease-in-out), box-shadow 500ms var(--ease-in-out)",
            }}
          />
        );
      })}
    </div>
  );
}
