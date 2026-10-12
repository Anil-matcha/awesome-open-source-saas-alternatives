// Structural validation of data.json. Exits 1 with a list of problems.
// Usage: node scripts/validate.mjs
import { readFile } from "node:fs/promises";

const file = process.env.DATA_FILE || new URL("../data.json", import.meta.url);
const data = JSON.parse(await readFile(file, "utf8"));
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const errors = [];
const slugs = new Set();

for (const t of data) {
  const at = `tool "${t.name}"`;
  if (!t.slug || !t.name || !t.category || !t.description) errors.push(`${at}: slug, name, category and description are required`);
  if (slugs.has(t.slug)) errors.push(`${at}: duplicate slug ${t.slug}`);
  slugs.add(t.slug);
  if (!Array.isArray(t.alternatives) || !t.alternatives.length) errors.push(`${at}: needs at least one alternative`);
  const repos = new Set();
  for (const a of t.alternatives || []) {
    const aa = `${at} > "${a.name}"`;
    if (!a.name || !a.license || !a.description) errors.push(`${aa}: name, license and description are required`);
    if (a.repo ? !REPO.test(a.repo) : !/^https:\/\//.test(a.url || "")) errors.push(`${aa}: needs a valid repo (owner/name) or an https url`);
    if ((a.description || "").length > 160) errors.push(`${aa}: description over 160 chars`);
    if (/[<>\n]/.test(a.description || "")) errors.push(`${aa}: description must be plain single-line text`);
    const key = (a.repo || a.url || "").toLowerCase();
    if (repos.has(key)) errors.push(`${aa}: listed twice under the same tool`);
    repos.add(key);
  }
}
if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`data.json OK: ${data.length} tools`);
