import type { Metadata } from "next";
import { Inter, Quicksand, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { PortalShell } from "@/components/PortalShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-quicksand", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "FIMCO — Client Portal",
  description: "Your investments with FIMCO on the Dar es Salaam Stock Exchange.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${quicksand.variable} ${mono.variable}`}>
      <body>
        <PortalShell>{children}</PortalShell>
      </body>
    </html>
  );
}
