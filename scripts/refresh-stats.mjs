// Refreshes GitHub stars, SPDX license and last-push date for every repo in
// data.json -> stats.json.
// Usage: GITHUB_TOKEN=... node scripts/refresh-stats.mjs
import { readFile, writeFile } from "node:fs/promises";

const dir = new URL("../", import.meta.url);
const tools = JSON.parse(await readFile(new URL("data.json", dir), "utf8"));
const repos = [...new Set(tools.flatMap((t) => t.alternatives.map((a) => a.repo)).filter(Boolean))];

const headers = { Accept: "application/vnd.github+json", "User-Agent": "muapi-oss-directory" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const stats = {};
for (const repo of repos) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) {
    console.warn(`skip ${repo}: HTTP ${res.status}`);
    continue;
  }
  const r = await res.json();
  const spdx = r.license?.spdx_id;
  stats[repo] = {
    stars: r.stargazers_count,
    license: spdx && spdx !== "NOASSERTION" ? spdx : null,
    pushedAt: r.pushed_at,
  };
}

await writeFile(new URL("stats.json", dir), JSON.stringify(stats, null, 2) + "\n");
console.log(`wrote stats for ${Object.keys(stats).length}/${repos.length} repos`);
