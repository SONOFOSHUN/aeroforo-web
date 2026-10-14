"use client";

import { useState } from "react";
import { Menu, Wind, X } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LiveBadge } from "./LiveBadge";

const LINKS = [
  { href: "#monitor", label: "Monitor en vivo" },
  { href: "#estaciones", label: "Estaciones" },
  { href: "#niveles", label: "Semáforo" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#equipo", label: "Equipo" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { paused } = useAir();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent">
            <Wind size={18} />
          </span>
          Aeróforo
        </a>
        <ul className="hidden items-center gap-7 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-text">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          <LiveBadge paused={paused} />
          <button
            className="rounded-lg p-2 text-muted hover:text-text md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="border-t border-line px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="block py-2 text-muted hover:text-text">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
