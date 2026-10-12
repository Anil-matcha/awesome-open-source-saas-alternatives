// Fetches the latest Tranco rank (https://tranco-list.eu, a research ranking of
// top websites) for each tool's domains and writes popularity.json:
//   { "<slug>": { rank: <best rank or null>, domain: "<domain used>" } }
// Domains come from tool.domains in data.json, falling back to scripts/tool-domains.json.
// Usage: node scripts/refresh-popularity.mjs
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("data.json", root), "utf8"));
const fallback = JSON.parse(await readFile(new URL("scripts/tool-domains.json", root), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new Map();

async function rankOf(domain) {
  if (cache.has(domain)) return cache.get(domain);
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`https://tranco-list.eu/api/ranks/domain/${encodeURIComponent(domain)}`, { headers: { "User-Agent": "awesome-oss-saas-alternatives" } });
    if (res.status === 429) { await sleep(5000 * (attempt + 1)); continue; }
    if (!res.ok) break;
    const json = await res.json();
    const rank = json.ranks?.[0]?.rank ?? null;
    cache.set(domain, rank);
    await sleep(1500);
    return rank;
  }
  cache.set(domain, null);
  return null;
}

const out = {};
for (const t of data) {
  const domains = t.domains || fallback[t.name] || [];
  let best = null, used = null;
  for (const d of domains) {
    const r = await rankOf(d);
    if (r != null && (best == null || r < best)) { best = r; used = d; }
  }
  out[t.slug] = { rank: best, domain: used };
}
await writeFile(new URL("popularity.json", root), JSON.stringify(out, null, 1) + "\n");
console.log(`ranked ${Object.values(out).filter((v) => v.rank != null).length}/${data.length} tools`);
