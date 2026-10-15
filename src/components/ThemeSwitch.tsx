"use client";

import { useRef } from "react";
import { setTheme, useTheme } from "@/lib/theme";

/**
 * Switch de tema: el botón se desliza con resorte, el sol se convierte en luna
 * (un círculo "muerde" el sol) y aparecen estrellas en el modo oscuro.
 */
export function ThemeSwitch() {
  const theme = useTheme();
  const dark = theme === "dark";
  const ref = useRef<HTMLButtonElement>(null);

  function toggle() {
    const r = ref.current?.getBoundingClientRect();
    setTheme(dark ? "light" : "dark", r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined);
  }

  return (
    <button
      ref={ref}
      role="switch"
      aria-checked={dark}
      aria-label="Modo oscuro"
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={toggle}
      className="group relative h-8 w-[58px] shrink-0 overflow-hidden rounded-full border border-line-strong transition-[background-color,border-color] duration-500 active:scale-[0.97]"
      style={{
        background: dark
          ? "linear-gradient(135deg, #1e2433 0%, #0f1320 100%)"
          : "linear-gradient(135deg, #bfe3ff 0%, #8ccaf7 100%)",
        transitionTimingFunction: "var(--ease-in-out)",
      }}
    >
      {/* Estrellas (modo oscuro) */}
      <span aria-hidden className="absolute inset-0">
        {[
          [10, 9, 2],
          [18, 19, 1.5],
          [26, 8, 1],
          [14, 23, 1],
        ].map(([l, t, s], i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: l,
              top: t,
              width: s,
              height: s,
              opacity: dark ? 0.9 : 0,
              transform: dark ? "translateY(0)" : "translateY(6px)",
              transition: `opacity 400ms var(--ease-out) ${dark ? 120 + i * 50 : 0}ms, transform 400ms var(--ease-out) ${dark ? 120 + i * 50 : 0}ms`,
            }}
          />
        ))}
      </span>
      {/* Nube (modo claro) */}
      <span
        aria-hidden
        className="absolute bottom-[5px] right-[7px] h-[7px] w-[16px] rounded-full bg-white/90"
        style={{
          opacity: dark ? 0 : 1,
          transform: dark ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 300ms var(--ease-out), transform 400ms var(--ease-out)",
        }}
      />
      {/* Perilla: sol que se convierte en luna */}
      <span
        aria-hidden
        className="absolute left-[3px] top-[3px] h-6 w-6 overflow-hidden rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        style={{
          transform: dark ? "translateX(26px) rotate(-20deg)" : "translateX(0) rotate(0deg)",
          background: dark ? "#e8e6df" : "#fbbf24",
          boxShadow: dark ? "0 0 10px rgba(232,230,223,0.35)" : "0 0 10px rgba(251,191,36,0.55)",
          transition:
            "transform 450ms cubic-bezier(0.34, 1.36, 0.64, 1), background-color 400ms var(--ease-in-out), box-shadow 400ms var(--ease-in-out)",
        }}
      >
        {/* El "mordisco" que forma la luna */}
        <span
          className="absolute h-6 w-6 rounded-full"
          style={{
            background: "#0f1320",
            transform: dark ? "translate(9px, -7px)" : "translate(26px, -26px)",
            transition: "transform 450ms var(--ease-out)",
          }}
        />
        {/* Cráteres */}
        <span className="absolute left-[5px] top-[12px] h-[4px] w-[4px] rounded-full bg-black/10" style={{ opacity: dark ? 1 : 0, transition: "opacity 300ms ease" }} />
        <span className="absolute left-[10px] top-[16px] h-[3px] w-[3px] rounded-full bg-black/10" style={{ opacity: dark ? 1 : 0, transition: "opacity 300ms ease" }} />
      </span>
    </button>
  );
}
