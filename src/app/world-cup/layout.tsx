import type { Metadata } from "next";
import { hanken } from "@/lib/fonts";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { FAQ } from "./faq";

const TITLE = "World Cup 2026 Simulator & Bracket Predictor";
const DESCRIPTION =
  "Free World Cup 2026 simulator: rank all 12 groups, pick the 8 best third-placed teams, then predict every knockout match on the official 48-team bracket — Round of 32 to the final. No sign-up, saves automatically.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/world-cup" },
  keywords: [
    "World Cup 2026 simulator",
    "World Cup 2026 bracket predictor",
    "World Cup 2026 predictions",
    "FIFA World Cup 2026 bracket",
    "World Cup 2026 knockout bracket",
    "World Cup simulator free",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/world-cup",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: TITLE,
    url: `${SITE_URL}/world-cup`,
    description: DESCRIPTION,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    about: {
      "@type": "SportsEvent",
      name: "FIFA World Cup 2026",
      startDate: "2026-06-11",
      endDate: "2026-07-19",
      location: [
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "Canada" },
        { "@type": "Country", name: "Mexico" },
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "World Cup 2026 Simulator", item: `${SITE_URL}/world-cup` },
    ],
  },
];

export default function WorldCupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={hanken.className}>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
