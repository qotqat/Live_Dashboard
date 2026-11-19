import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import type { Viewport } from "next";

import { dirFor, getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#00808f",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={cairo.variable}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
