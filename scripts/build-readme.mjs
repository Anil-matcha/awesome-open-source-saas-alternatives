// Generates README.md from data.json + stats.json.
// Usage: node scripts/build-readme.mjs
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const tools = JSON.parse(await readFile(new URL("data.json", root), "utf8"));
const stats = JSON.parse(await readFile(new URL("stats.json", root), "utf8"));
// popularity.json: Tranco rank per tool slug (lower = more popular), see refresh-popularity.mjs
const popularity = JSON.parse(await readFile(new URL("popularity.json", root), "utf8").catch(() => "{}"));
// featured.json: hand-picked household-name apps, in display order (edit freely).
const featured = JSON.parse(await readFile(new URL("featured.json", root), "utf8").catch(() => "[]"));
// Products on these giant parent sites aren't ranked by the parent's traffic.
const SHARED = new Set(["google.com", "microsoft.com", "office.com", "amazon.com", "github.com", "adobe.com", "atlassian.com", "openai.com", "perfectcorp.com", "firebase.google.com"]);
const rankOf = (t) => {
  const f = featured.indexOf(t.name);
  if (f >= 0) return f;
  const p = popularity[t.slug];
  return p?.rank != null && !SHARED.has(p.domain) ? 1000 + p.rank : Infinity;
};
const byPopularity = (a, b) => rankOf(a) - rankOf(b) || a.name.localeCompare(b.name);

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const anchor = (s) => s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

const byCategory = {};
for (const t of tools) (byCategory[t.category] ||= []).push(t);
const bestRank = (c) => Math.min(...byCategory[c].map(rankOf));
const categories = Object.keys(byCategory).sort((a, b) => bestRank(a) - bestRank(b) || a.localeCompare(b));

const rows = (t) =>
  t.alternatives
    .map((a) => {
      const s = a.repo ? stats[a.repo] : null;
      const link = a.repo ? `https://github.com/${a.repo}` : a.url;
      const stars = s?.stars != null ? `★ ${fmt(s.stars)}` : "";
      const license = s?.license || a.license;
      return `| [${a.name}](${link}) | ${a.description} | ${license} | ${stars} |`;
    })
    .join("\n");

let out = `# Awesome Open Source SaaS Alternatives [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

> A curated list of open source alternatives to paid SaaS apps, with licenses and GitHub stars.

Looking for a free, self-hostable replacement for a paid tool? Find the tool below and pick an alternative. **Want to add yours? [Submit it here](../../issues/new?template=add-alternative.yml)**, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Contents

${categories.map((c) => `- [${c}](#${anchor(c)})`).join("\n")}

`;

for (const c of categories) {
  out += `## ${c}\n\n`;
  for (const t of byCategory[c].sort(byPopularity)) {
    out += `### ${t.name}\n\n${t.description}\n\n| Alternative | Description | License | Stars |\n|---|---|---|---|\n${rows(t)}\n\n`;
  }
}

out += `## Notes

- Licenses and star counts are refreshed from the GitHub API and can change. Check each project before you adopt it.
- "Open source" here means source is publicly available. Some entries use fair-code or source-available licenses and are marked as such.

## Data sources

- **Curated entries:** the original tool-to-alternative pairs are maintained by hand in [\`data.json\`](data.json).
- **Discovered entries:** more pairs were found with the [GitHub Search API](https://docs.github.com/en/rest/search/search#search-repositories) by looking for public repositories whose description says "alternative to X". Those entries reuse the repository's own GitHub description, and a human decided which targets are paid SaaS products.
- **Ordering:** a hand-picked set of household-name apps (see [\`featured.json\`](featured.json)) comes first, then the rest by the [Tranco](https://tranco-list.eu) ranking of each product's website. Products that share a giant parent site (Google, Microsoft, Adobe, Amazon) aren't ranked by that site's traffic. Categories are ordered by their most popular app. Alternatives within an app are listed as submitted.
- **Stars, licenses and last-push dates:** pulled from the [GitHub REST API](https://docs.github.com/en/rest/repos/repos#get-a-repository) and refreshed weekly. Where GitHub can't detect a license, the entry says "See repo".
- **Community submissions:** added through the [issue form](../../issues/new?template=add-alternative.yml) and pull requests.
- **Verification:** the original curated pairs were cross-checked against independent sources (comparison articles and directories). Where a project replaces only part of a product, its description says so.
- **Disclosure:** some listed projects are maintained by the author of this list ([Anil-matcha](https://github.com/Anil-matcha) and [SamurAIGPT](https://github.com/SamurAIGPT)). Each one's own repository description claims it as an alternative to the listed app.
- This list does not copy data from AlternativeTo, OpenAlternative or other directories.

## Contributing

Add or edit entries in [\`data.json\`](data.json), then run:

\`\`\`bash
GITHUB_TOKEN=... node scripts/refresh-stats.mjs
node scripts/build-readme.mjs
\`\`\`

README.md is generated, so please don't edit it by hand.
`;

await writeFile(new URL("README.md", root), out);
console.log(`README.md written: ${tools.length} tools, ${categories.length} categories`);
