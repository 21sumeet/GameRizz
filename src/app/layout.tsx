import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { PageShell } from "@/components/layout/page-shell";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
