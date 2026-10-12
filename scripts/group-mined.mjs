// Groups mined repos by the proprietary tool they claim to replace.
// Usage: node scripts/group-mined.mjs <mined-raw.json> <grouped.json>
import { readFile, writeFile } from "node:fs/promises";

const [inFile, outFile] = process.argv.slice(2);
const repos = JSON.parse(await readFile(inFile, "utf8"));
const cutoff = Date.now() - 18 * 30 * 864e5;
const RE = /alternatives? (?:to|for)\s+(.+)/i;
const STOP = /^(the|a|an|your|any|all|many|other|some|popular|commercial|proprietary|existing|google's|microsoft's)\b/i;

function targets(desc) {
  const m = (desc || "").replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, "").match(RE);
  if (!m) return [];
  const head = m[1].split(/[.;:()|\n!]| - | — | that | which | with | for | built | written | using /i)[0];
  return head
    .split(/,| and | or | & |\/| \+ /i)
    .map((s) => s.trim().replace(/^(the|a)\s+/i, "").replace(/[*_`"']+/g, ""))
    .filter((s) => s && s.length <= 30 && s.split(/\s+/).length <= 3 && /^[A-Z0-9]/.test(s) && !STOP.test(s));
}

const groups = {};
for (const r of repos) {
  if (new Date(r.pushedAt).getTime() < cutoff) continue;
  for (const t of targets(r.description)) {
    const key = t.toLowerCase();
    (groups[key] ||= { name: t, alternatives: [] }).alternatives.push(r);
  }
}
const list = Object.values(groups)
  .map((g) => ({ ...g, alternatives: g.alternatives.sort((a, b) => b.stars - a.stars).slice(0, 5) }))
  .sort((a, b) => b.alternatives[0].stars - a.alternatives[0].stars);
await writeFile(outFile, JSON.stringify(list, null, 1));
console.log(`${list.length} tools from ${repos.length} repos`);
for (const g of list.slice(0, 40)) console.log(`${g.name.padEnd(22)} <- ${g.alternatives.map((a) => a.repo.split("/")[1]).join(", ")}`);
console.log("...random tail sample:");
for (const g of list.slice(100).filter((_, i) => i % 12 === 0).slice(0, 14)) console.log(`${g.name.padEnd(22)} <- ${g.alternatives.map((a) => a.repo).join(", ")}`);
