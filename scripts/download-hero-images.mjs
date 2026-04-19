/**
 * Downloads the hero player portraits from sofifa (and optionally wikipedia
 * fallbacks) into public/hero/. Run once locally:
 *
 *   node scripts/download-hero-images.mjs
 *
 * Re-run any time you change the HEROES list in src/app/page.tsx — the slugs
 * here must match the `slug` field there.
 *
 * If sofifa returns 403 from your IP, the script falls back to the `fallback`
 * URL (public-domain Wikimedia press photos). If BOTH fail for a player, it
 * prints an error and exits non-zero so you notice.
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const HEROES = [
  // id = sofifa player id, slug = local filename (must match page.tsx)
  {
    slug: "mbappe",
    sofifa: "https://cdn.sofifa.net/players/231/747/26_120.png",
    fallback:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Kylian_Mbapp%C3%A9_2019.jpg/240px-Kylian_Mbapp%C3%A9_2019.jpg",
  },
  {
    slug: "salah",
    sofifa: "https://cdn.sofifa.net/players/209/331/26_120.png",
    fallback:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Mohamed_Salah_2018.jpg/240px-Mohamed_Salah_2018.jpg",
  },
  {
    slug: "haaland",
    sofifa: "https://cdn.sofifa.net/players/239/085/26_120.png",
    fallback:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Erling_Haaland_2023_%28cropped%29.jpg/240px-Erling_Haaland_2023_%28cropped%29.jpg",
  },
  {
    slug: "bellingham",
    sofifa: "https://cdn.sofifa.net/players/252/371/26_120.png",
    fallback:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Jude_Bellingham_2023_%28cropped%29.jpg/240px-Jude_Bellingham_2023_%28cropped%29.jpg",
  },
  {
    slug: "rodri",
    sofifa: "https://cdn.sofifa.net/players/231/866/26_120.png",
    fallback:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Rodri_2022_%28cropped%29.jpg/240px-Rodri_2022_%28cropped%29.jpg",
  },
  {
    slug: "vandijk",
    sofifa: "https://cdn.sofifa.net/players/203/376/26_120.png",
    fallback:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Virgil_van_Dijk_2018.jpg/240px-Virgil_van_Dijk_2018.jpg",
  },
];

const OUT_DIR = path.resolve("public/hero");
fs.mkdirSync(OUT_DIR, { recursive: true });

function fetchBinary(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          ...headers,
        },
      },
      (res) => {
        // Handle 301/302 redirects (Wikimedia does this).
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          res.resume();
          return resolve(fetchBinary(res.headers.location, headers));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} ${url}`));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ buf: Buffer.concat(chunks), contentType: res.headers["content-type"] ?? "" }));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(15_000, () => req.destroy(new Error(`timeout ${url}`)));
  });
}

async function downloadOne(hero) {
  const destPng = path.join(OUT_DIR, `${hero.slug}.png`);
  const destJpg = path.join(OUT_DIR, `${hero.slug}.jpg`);

  // Try sofifa first with a Referer to bypass hotlink protection.
  try {
    const r = await fetchBinary(hero.sofifa, { Referer: "https://sofifa.com/" });
    fs.writeFileSync(destPng, r.buf);
    // Clean up any stale JPG from a previous fallback run.
    if (fs.existsSync(destJpg)) fs.unlinkSync(destJpg);
    return { slug: hero.slug, source: "sofifa", bytes: r.buf.length };
  } catch (err) {
    console.warn(`  sofifa blocked for ${hero.slug}: ${err.message} — trying Wikimedia…`);
  }

  // Fallback: Wikimedia press photo.
  try {
    const r = await fetchBinary(hero.fallback);
    const ext = r.contentType.includes("png") ? "png" : "jpg";
    const dest = path.join(OUT_DIR, `${hero.slug}.${ext}`);
    fs.writeFileSync(dest, r.buf);
    return { slug: hero.slug, source: "wikimedia", bytes: r.buf.length, ext };
  } catch (err) {
    return { slug: hero.slug, source: "FAILED", error: err.message };
  }
}

console.log(`Downloading ${HEROES.length} hero images to ${OUT_DIR} …\n`);
const results = [];
for (const h of HEROES) {
  const r = await downloadOne(h);
  results.push(r);
  if (r.source === "FAILED") {
    console.error(`✗ ${r.slug.padEnd(12)} FAILED: ${r.error}`);
  } else {
    console.log(
      `✓ ${r.slug.padEnd(12)} ${r.source.padEnd(9)} ${(r.bytes / 1024).toFixed(1)} KB` +
        (r.ext ? ` (.${r.ext})` : ""),
    );
  }
}

const failed = results.filter((r) => r.source === "FAILED");
if (failed.length > 0) {
  console.error(`\n${failed.length} image(s) failed. See warnings above.`);
  process.exit(1);
}
console.log(`\nAll hero images saved. Commit the public/hero/ folder.`);
