import { LEVELS, LEVEL_ORDER } from "@/lib/air";
import type { Level } from "@/lib/types";

/** Cabezal del Aeróforo: tres luces, la activa brilla según el nivel. */
export function Semaforo({ level, size = "md" }: { level: Level | null; size?: "sm" | "md" | "lg" }) {
  const dim = { sm: "h-5 w-5", md: "h-12 w-12", lg: "h-16 w-16 sm:h-20 sm:w-20" }[size];
  const pad = { sm: "gap-1 p-1.5 rounded-full", md: "gap-3 p-3 rounded-[1.75rem]", lg: "gap-4 p-4 rounded-[2.25rem]" }[size];
  return (
    <div
      role="img"
      aria-label={level ? `Semáforo en ${level}: ${LEVELS[level].label}` : "Semáforo sin datos"}
      className={`flex flex-col border border-white/10 bg-[#05080f] shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)] ${pad}`}
    >
      {[...LEVEL_ORDER].reverse().map((l) => {
        const on = l === level;
        const c = LEVELS[l].color;
        return (
          <span
            key={l}
            className={`${dim} rounded-full transition-all duration-500`}
            style={{
              background: on ? `radial-gradient(circle at 35% 30%, #fff8 0%, ${c} 35%, ${c} 100%)` : `${c}1f`,
              boxShadow: on ? `0 0 24px 4px ${c}99, 0 0 60px 10px ${c}40` : "inset 0 0 8px rgba(0,0,0,0.6)",
            }}
          />
        );
      })}
    </div>
  );
}
