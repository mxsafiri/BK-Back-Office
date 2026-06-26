import type { Metadata } from "next";
import { Inter, Quicksand } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-quicksand", display: "swap" });

export const metadata: Metadata = {
  title: "FIMCO — Broker Back Office for the DSE",
  description:
    "A sell-side broker back office for the Dar es Salaam Stock Exchange: trade reconciliation, settlement, client cash & securities ledgers, and regulatory reporting — with nTZS settlement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${quicksand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
