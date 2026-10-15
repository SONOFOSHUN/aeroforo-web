import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aeróforo · Monitoreo de calidad del aire",
  description:
    "Aeróforo mide PM2.5, PM10, CO₂ y CO en 12 puntos de Lima Metropolitana y lo traduce en un semáforo verde, amarillo y rojo, con avisos y recomendaciones cuando el aire cambia.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster position="bottom-right" visibleToasts={3} offset={24} mobileOffset={12} gap={10} containerAriaLabel="Avisos de calidad del aire" />
      </body>
    </html>
  );
}
