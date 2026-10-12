import tools from "./data.json";
import stats from "./stats.json";

export const SITE_URL = "https://muapi.ai";
export const BASE_PATH = "/open-source-alternatives";

export function getAllTools() {
  return tools;
}

export function getTool(slug) {
  return tools.find((t) => t.slug === slug) || null;
}

export function getCategories() {
  return [...new Set(tools.map((t) => t.category))].sort();
}

// stats.json is written by scripts/refresh-oss-stats.mjs (GitHub API).
export function getRepoStats(repo) {
  return (repo && stats[repo]) || null;
}

export function withStats(alt) {
  const s = getRepoStats(alt.repo);
  return {
    ...alt,
    stars: s?.stars ?? null,
    license: s?.license || alt.license,
    pushedAt: s?.pushedAt ?? null,
    url: alt.repo ? `https://github.com/${alt.repo}` : alt.url,
  };
}

export function formatStars(n) {
  if (n == null) return null;
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);
}
