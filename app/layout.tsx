import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Enigma — AI Detective Board Game",
  description:
    "A fully on-chain AI detective board game powered by 0G Storage, 0G Compute, and 0G Chain. Five AI detectives compete to solve the mystery of Enigma.",
  keywords: [
    "AI detective game",
    "0G blockchain",
    "board game",
    "deduction game",
    "Enigma",
  ],
  openGraph: {
    title: "Enigma",
    description:
      "Five AI detectives race to solve the murder at Enigma — fully on-chain via 0G.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
