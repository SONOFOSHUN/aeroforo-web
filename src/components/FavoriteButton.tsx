"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";

/** Estrella para marcar un distrito como favorito. Al marcarla, da un pequeño salto. */
export function FavoriteButton({ stationId, district, className = "" }: { stationId: number; district: string; className?: string }) {
  const on = useFavorites().includes(stationId);
  const [pop, setPop] = useState(0);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!on) setPop((p) => p + 1);
        toggleFavorite(stationId);
      }}
      aria-pressed={on}
      aria-label={on ? `Quitar ${district} de mis distritos` : `Agregar ${district} a mis distritos`}
      title={on ? "Quitar de mis distritos" : "Agregar a mis distritos"}
      className={`pressable grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-hover ${className}`}
    >
      <Star
        key={pop}
        size={17}
        strokeWidth={on ? 0 : 1.75}
        className={on ? `fill-amber text-amber ${pop > 0 ? "star-pop" : ""}` : "text-faint"}
        style={{ transition: "color 160ms ease, fill 160ms ease" }}
      />
    </button>
  );
}
