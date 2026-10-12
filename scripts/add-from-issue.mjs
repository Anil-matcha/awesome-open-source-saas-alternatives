// Turns an "Add an open source alternative" issue into a data.json change.
// Untrusted input arrives ONLY through env vars/files and is validated here.
// Env: ISSUE_BODY, GITHUB_TOKEN, DATA_FILE (optional), RESULT_FILE (optional)
// Writes a short markdown message to RESULT_FILE and exits 0 (changed) or 1 (rejected).
import { readFile, writeFile } from "node:fs/promises";

const dataPath = process.env.DATA_FILE || new URL("../data.json", import.meta.url);
const resultPath = process.env.RESULT_FILE || "issue-result.md";
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

async function reject(msg) {
  await writeFile(resultPath, `Thanks for the suggestion, but I couldn't add it automatically:\n\n${msg}\n\nPlease edit the issue to fix this, or open a pull request.`);
  process.exit(1);
}

// Issue-form bodies look like "### Label\n\nvalue".
const fields = {};
for (const block of (process.env.ISSUE_BODY || "").split(/^### /m).slice(1)) {
  const [label, ...rest] = block.split("\n");
  fields[label.trim()] = rest.join("\n").trim();
}
const clean = (s) => (s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const get = (prefix) => clean(Object.entries(fields).find(([k]) => k.startsWith(prefix))?.[1]);
const none = (s) => (s === "_No response_" ? "" : s);

const toolName = none(get("Paid SaaS app"));
const repo = none(get("GitHub repository")).replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
const nameInput = none(get("Project name"));
const description = none(get("One-line description")).slice(0, 160);
const category = none(get("Category"));

if (!toolName || toolName.length > 60) await reject("- The SaaS app name is missing or too long.");
if (!REPO.test(repo)) await reject("- The repository must look like `owner/name`.");
if (!description) await reject("- A one-line description is required.");

const res = await fetch(`https://api.github.com/repos/${repo}`, {
  headers: { Accept: "application/vnd.github+json", "User-Agent": "awesome-oss-alternatives-bot", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
});
if (!res.ok) await reject(`- \`${repo}\` was not found on GitHub (HTTP ${res.status}). It must be a public repository.`);
const r = await res.json();
if (r.archived) await reject(`- \`${repo}\` is archived.`);
if (r.private || r.fork) await reject(`- \`${repo}\` must be a public, non-fork repository.`);

const data = JSON.parse(await readFile(dataPath, "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
let tool = data.find((t) => t.slug === slugify(toolName) || norm(t.name) === norm(toolName));
let created = false;
if (!tool) {
  tool = { slug: slugify(toolName), name: toolName, category: category || "More alternatives", description: `${toolName}: paid SaaS product.`, alternatives: [] };
  data.push(tool);
  created = true;
}
if (tool.alternatives.some((a) => (a.repo || "").toLowerCase() === r.full_name.toLowerCase()))
  await reject(`- \`${r.full_name}\` is already listed under ${tool.name}.`);

const spdx = r.license?.spdx_id;
tool.alternatives.push({
  name: nameInput.slice(0, 40) || r.name,
  repo: r.full_name,
  license: spdx && spdx !== "NOASSERTION" ? spdx : "See repo",
  description,
});
await writeFile(dataPath, JSON.stringify(data, null, 1) + "\n");
await writeFile(resultPath, `Added **${nameInput || r.name}** (\`${r.full_name}\`) ${created ? `under a new entry for **${tool.name}**` : `as another alternative to **${tool.name}**`}. A pull request is on its way.`);
