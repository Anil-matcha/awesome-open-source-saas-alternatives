"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export default function OssIndexClient({ tools, categories, basePath }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.alternatives.some((a) => a.name.toLowerCase().includes(q))
      );
    });
  }, [tools, query, category]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a tool, e.g. Notion, Slack, Firebase"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <p className="text-sm opacity-60 mb-4">{filtered.length} tools</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Link
            key={t.slug}
            href={`${basePath}/${t.slug}`}
            className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-white/30 transition"
          >
            <div className="text-xs opacity-60 mb-1">{t.category}</div>
            <h2 className="text-lg font-semibold mb-1">{t.name} alternatives</h2>
            <p className="text-sm opacity-70 mb-3">{t.description}</p>
            <p className="text-xs opacity-60">
              {t.alternatives.map((a) => a.name).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
