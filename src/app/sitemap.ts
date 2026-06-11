import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/world-cup`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/higher-or-lower`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/playerdle`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/fut-draft`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/who-am-i`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/squad-draft`, lastModified, changeFrequency: "monthly", priority: 0.7 },
  ];
}
