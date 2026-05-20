import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Dancing_Script,
  Noto_Sans_TC,
} from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-tc",
  weight: ["500"],
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jill's blog",
    template: "%s | Jill's blog",
  },
  description: "一個專注於高品質技術內容的個人部落格。",
  openGraph: {
    type: "website",
    siteName: "Jill's blog",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "H6gEVeYoTWvYbFiHb4mPjj8l_Qd9WAZ_c3qtH_xMtiU",
  },
};

const SITE_NAME = "Jill's blog";
const SITE_DESCRIPTION = "一個專注於高品質技術內容的個人部落格。";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  // 啟用 Google sitelinks 搜尋框（指向本站 /search?q=）
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const themeInitScript = `(() => {
  try {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored ?? (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      data-theme="light"
      className={`${inter.variable} ${playfair.variable} ${dancing.variable} ${notoSansTC.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <JsonLd data={websiteJsonLd} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
