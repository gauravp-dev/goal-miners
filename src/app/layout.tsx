import "./globals.css";
import "../styles/minimal-theme.css";
import type { Metadata, Viewport } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Goal Miners — Football Party Games & World Cup 2026 Simulator",
    template: "%s | Goal Miners",
  },
  description:
    "Five free multiplayer football party games powered by 10,654 real footballers, plus a World Cup 2026 bracket simulator. Create a room, share a link, play in your browser — no downloads, no accounts.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: "Goal Miners — Football Party Games & World Cup 2026 Simulator",
    description:
      "Free multiplayer football games and a World Cup 2026 bracket simulator. Play in your browser — no downloads, no accounts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Goal Miners — Football Party Games & World Cup 2026 Simulator",
    description:
      "Free multiplayer football games and a World Cup 2026 bracket simulator. Play in your browser — no downloads, no accounts.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  width: "device-width",
  initialScale: 1,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Free multiplayer football party games and a World Cup 2026 bracket simulator.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  );
}
