import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";

import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { siteName, siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

const description =
  "Check the legal jeep and tricycle fare in Cabanatuan City before you pay.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pamasahe Cabanatuan: jeep and tricycle fares",
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  openGraph: {
    siteName,
    locale: "en_PH",
    type: "website",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3F8B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("antialiased", manrope.variable)}>
      <body className="flex min-h-dvh flex-col">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
