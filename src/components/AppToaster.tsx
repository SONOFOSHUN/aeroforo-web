"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";

/** Un único Toaster en la raíz; sigue el tema claro/oscuro del switch. */
export function AppToaster() {
  return (
    <Toaster
      theme={useTheme()}
      position="bottom-right"
      visibleToasts={3}
      offset={24}
      mobileOffset={12}
      gap={12}
      containerAriaLabel="Avisos de calidad del aire"
    />
  );
}
