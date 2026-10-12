// Mines GitHub for repos whose description says "alternative to X".
// Usage: GITHUB_TOKEN=... node scripts/mine-alternatives.mjs <out.json>
import { writeFile } from "node:fs/promises";

const out = process.argv[2];
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "awesome-oss-alternatives-miner",
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bands = ["20000..*", "10000..19999", "5000..9999", "3000..4999", "2000..2999", "1500..1999", "1000..1499", "700..999", "500..699"];
const queries = ['"alternative to"', '"alternative for"'];

const repos = new Map();
for (const q of queries) {
  for (const band of bands) {
    for (let page = 1; page <= 10; page++) {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(`${q} in:description stars:${band} archived:false`)}&sort=stars&per_page=100&page=${page}`;
      const res = await fetch(url, { headers });
      if (!res.ok) { console.warn(`HTTP ${res.status} ${q} ${band} p${page}`); await sleep(10000); break; }
      const json = await res.json();
      for (const r of json.items) repos.set(r.full_name, {
        repo: r.full_name, description: r.description, stars: r.stargazers_count,
        license: r.license?.spdx_id ?? null, pushedAt: r.pushed_at, topics: r.topics,
      });
      await sleep(2300); // search API: 30 req/min
      if (json.items.length < 100) break;
    }
    console.log(`${q} ${band}: total ${repos.size}`);
  }
}
await writeFile(out, JSON.stringify([...repos.values()], null, 1));
console.log(`saved ${repos.size} repos -> ${out}`);
