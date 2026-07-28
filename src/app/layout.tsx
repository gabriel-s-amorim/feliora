import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import {
  SITE_BG_COLOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  SITE_ORIGIN,
  SITE_THEME_COLOR,
  SITE_TITLE,
} from "@/shared/const/site";
import { getSiteOrigin } from "@/lib/siteOrigin";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const siteOrigin = getSiteOrigin(SITE_ORIGIN);

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: SITE_TITLE,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon-32.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: SITE_OG_IMAGE_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_OG_IMAGE_PATH],
  },
};

export const viewport: Viewport = {
  themeColor: SITE_THEME_COLOR,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${outfit.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col bg-cream text-ink"
        style={{ backgroundColor: SITE_BG_COLOR }}
      >
        {children}
      </body>
    </html>
  );
}
