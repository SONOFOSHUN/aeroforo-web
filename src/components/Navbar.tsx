"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LiveBadge } from "./LiveBadge";
import { Semaforo } from "./Semaforo";
import { ThemeSwitch } from "./ThemeSwitch";

const LINKS = [
  { href: "#monitor", label: "Monitor" },
  { href: "#estaciones", label: "Mapa" },
  { href: "#niveles", label: "Semáforo" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#equipo", label: "Equipo" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { paused, latest, selectedId } = useAir();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color] duration-300 ${
        scrolled || open ? "border-line bg-bg/80" : "border-transparent bg-bg/0"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <Semaforo level={latest(selectedId)?.level ?? null} size="xs" />
          Aeróforo
        </a>
        <ul className="hidden items-center gap-1 text-sm text-muted md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3 py-1.5 transition-colors duration-150 hover:bg-hover hover:text-text">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <LiveBadge paused={paused} />
          <ThemeSwitch />
          <button
            className="pressable grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-hover hover:text-text md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="border-t border-line px-4 py-2 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={() => setOpen(false)} className="block py-2.5 text-[15px] text-muted hover:text-text">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
