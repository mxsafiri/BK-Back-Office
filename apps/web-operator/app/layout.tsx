import type { Metadata } from "next";
import { Inter, Quicksand } from "next/font/google";
import "./globals.css";
import { OperatorShell } from "@/components/OperatorShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-quicksand", display: "swap" });

export const metadata: Metadata = {
  title: "FIMCO — Operator Console",
  description: "Internal back-office console for the FIMCO broker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${quicksand.variable}`}>
      <body>
        <OperatorShell>{children}</OperatorShell>
      </body>
    </html>
  );
}
