"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_METRICS, LEVELS, LEVEL_ORDER, RECOMMENDATIONS } from "@/lib/air";
import type { Level } from "@/lib/types";

const SIZES = {
  xs: { dim: "h-2.5 w-2.5", pad: "gap-[3px] p-1 rounded-full" },
  sm: { dim: "h-4 w-4", pad: "gap-1 p-1.5 rounded-full" },
  md: { dim: "h-11 w-11", pad: "gap-2.5 p-2.5 rounded-[26px]" },
  lg: { dim: "h-14 w-14 sm:h-[72px] sm:w-[72px]", pad: "gap-3 p-3 rounded-[34px] sm:gap-3.5 sm:p-3.5 sm:rounded-[44px]" },
};

const POP_W = 320;
const GAP = 14;
const OPEN_DELAY = 90;
const CLOSE_DELAY = 140;

/**
 * Cabezal del Aeróforo: carcasa grafito con tres luces; la activa se enciende según el nivel.
 * Con `interactive`, cada luz muestra su leyenda al pasar el mouse o al tocarla.
 */
export function Semaforo({
  level,
  size = "md",
  interactive = false,
}: {
  level: Level | null;
  size?: keyof typeof SIZES;
  interactive?: boolean;
}) {
  const { dim, pad } = SIZES[size];
  const [open, setOpen] = useState<Level | null>(null);
  const [instant, setInstant] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const lights = useRef<Partial<Record<Level, HTMLButtonElement | null>>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const openRef = useRef<Level | null>(null);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const show = useCallback((l: Level, delay = OPEN_DELAY) => {
    clear();
    timer.current = setTimeout(() => {
      // Si ya hay una leyenda abierta, la siguiente aparece al instante (sin animar)
      setInstant(openRef.current !== null);
      setAnchor(lights.current[l] ?? null);
      setOpen(l);
    }, delay);
  }, []);
  const hide = useCallback((delay = CLOSE_DELAY) => {
    clear();
    timer.current = setTimeout(() => setOpen(null), delay);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onScroll = () => setOpen(null);
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (Object.values(lights.current).some((b) => b?.contains(t))) return;
      if ((t as Element).closest?.("[data-semaforo-legend]")) return;
      setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  useEffect(() => clear, []);

  return (
    <>
      <div
        role={interactive ? "group" : "img"}
        aria-label={level ? `Semáforo en ${LEVELS[level].label}` : "Semáforo sin datos"}
        className={`flex shrink-0 flex-col bg-[#15181d] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_30px_-10px_rgba(0,0,0,0.5)] ${pad}`}
      >
        {[...LEVEL_ORDER].reverse().map((l) => {
          const on = l === level;
          const c = LEVELS[l].color;
          const style = {
            background: on ? `radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55), ${c} 42%)` : `${c}26`,
            boxShadow: on ? `0 0 18px 2px ${c}80` : "inset 0 1px 3px rgba(0,0,0,0.6)",
            transition: "background 500ms var(--ease-in-out), box-shadow 500ms var(--ease-in-out), transform 160ms var(--ease-out)",
          };
          if (!interactive) return <span key={l} className={`${dim} rounded-full`} style={style} />;
          return (
            <button
              key={l}
              ref={(el) => {
                lights.current[l] = el;
              }}
              type="button"
              aria-label={`Qué significa la luz ${l}: ${LEVELS[l].label}`}
              aria-expanded={open === l}
              className={`${dim} cursor-help rounded-full outline-offset-4 hover:scale-[1.06] active:scale-[0.96] ${open === l ? "ring-2 ring-white/60" : ""}`}
              style={style}
              onPointerEnter={(e) => e.pointerType === "mouse" && show(l)}
              onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
              onFocus={() => show(l, 0)}
              onBlur={() => hide()}
              onClick={() => (open === l ? setOpen(null) : show(l, 0))}
            />
          );
        })}
      </div>
      {interactive && open && (
        <Legend
          level={open}
          anchor={anchor}
          instant={instant}
          onEnter={clear}
          onLeave={() => hide()}
        />
      )}
    </>
  );
}

/** Leyenda flotante de una luz: qué significa, qué hacer y los límites de cada contaminante. */
function Legend({
  level,
  anchor,
  instant,
  onEnter,
  onLeave,
}: {
  level: Level;
  anchor: HTMLElement | null;
  instant: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; origin: string } | null>(null);
  const info = LEVELS[level];
  const i = LEVEL_ORDER.indexOf(level);

  // Se coloca a la derecha de la luz; si no cabe, a la izquierda; en móvil, debajo.
  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const h = ref.current.offsetHeight;
    const w = Math.min(POP_W, innerWidth - 24);
    const clampY = (y: number) => Math.max(12, Math.min(y, innerHeight - h - 12));
    let next: { left: number; top: number; origin: string };
    if (a.right + GAP + w <= innerWidth - 12) {
      next = { left: a.right + GAP, top: clampY(a.top + a.height / 2 - h / 2), origin: "left center" };
    } else if (a.left - GAP - w >= 12) {
      next = { left: a.left - GAP - w, top: clampY(a.top + a.height / 2 - h / 2), origin: "right center" };
    } else {
      const below = a.bottom + GAP + h <= innerHeight - 12;
      next = {
        left: Math.max(12, Math.min(a.left + a.width / 2 - w / 2, innerWidth - w - 12)),
        top: below ? a.bottom + GAP : Math.max(12, a.top - GAP - h),
        origin: below ? "top center" : "bottom center",
      };
    }
    setPos(next);
  }, [anchor, level]);

  return createPortal(
    <div
      ref={ref}
      data-semaforo-legend
      role="tooltip"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={`semaforo-legend fixed z-[60] overflow-hidden rounded-2xl border border-line bg-surface text-text shadow-[var(--shadow-float)] ${instant ? "instant" : ""}`}
      style={{
        width: `min(${POP_W}px, calc(100vw - 24px))`,
        left: pos?.left ?? -9999,
        top: pos?.top ?? 0,
        transformOrigin: pos?.origin,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: info.soft }}>
        <Semaforo level={level} size="sm" />
        <div>
          <p className="text-[17px] font-semibold tracking-tight" style={{ color: info.ink }}>
            {info.label}
          </p>
          <p className="text-[12px] text-muted tabular">{info.range}</p>
        </div>
      </div>
      <div className="px-4 pb-4 pt-3">
        <p className="text-[13px] leading-relaxed text-muted">{info.detail}</p>
        <p className="eyebrow mt-3 !text-[11px]">Qué hacer</p>
        <ul className="mt-1.5 space-y-1.5 text-[13px]">
          {RECOMMENDATIONS[level].map((t) => (
            <li key={t} className="flex gap-2 leading-snug">
              <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: info.color }} />
              {t}
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line pt-3 text-[12px]">
          {DEFAULT_METRICS.filter((m) => m.affects_level).map((m) => (
            <div key={m.code} className="flex justify-between gap-2">
              <dt className="text-muted">{m.name}</dt>
              <dd className="font-medium tabular">
                {i === 0 && `≤ ${m.good_max}`}
                {i === 1 && `${m.good_max}–${m.moderate_max}`}
                {i === 2 && `> ${m.moderate_max}`}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>,
    document.body,
  );
}
