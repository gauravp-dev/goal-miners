import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Game rooms are ephemeral multiplayer sessions — not useful in search.
        disallow: [
          "/higher-or-lower/",
          "/playerdle/",
          "/fut-draft/",
          "/who-am-i/",
          "/squad-draft/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
