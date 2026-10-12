import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  getAllTools,
  getTool,
  withStats,
  formatStars,
  BASE_PATH,
  SITE_URL,
} from "../lib";

export function generateStaticParams() {
  return getAllTools().map((t) => ({ tool: t.slug }));
}

export async function generateMetadata({ params }) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Not found | Muapi" };
  const year = new Date().getFullYear();
  const title = `Best Open Source Alternatives to ${tool.name} in ${year}`;
  const description = `Open source alternatives to ${tool.name}: ${tool.alternatives
    .map((a) => a.name)
    .join(", ")}. Compare licenses, GitHub stars and self-hosting.`;
  const url = `${SITE_URL}${BASE_PATH}/${tool.slug}`;
  return {
    title: { absolute: `${title} | Muapi` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Muapi", type: "article" },
  };
}

export default async function OssAlternativePage({ params }) {
  const { tool: slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const alternatives = tool.alternatives.map(withStats);
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Open source alternatives to ${tool.name}`,
    itemListElement: alternatives.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: a.name,
      url: a.url,
    })),
  };

  return (
    <main className="min-h-screen bg-bg-page text-primary-text flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />
      <div className="mx-auto w-full max-w-3xl px-4 pt-28 pb-20">
        <Link href={BASE_PATH} className="text-sm opacity-60 hover:opacity-100">
          ← All open source alternatives
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold mt-3 mb-2">
          Open source alternatives to {tool.name}
        </h1>
        <p className="opacity-70 mb-8">
          {tool.name}: {tool.description} These projects do similar jobs and
          have public source code.
        </p>

        <ol className="space-y-4">
          {alternatives.map((a, i) => (
            <li
              key={a.name}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold">
                  {i + 1}. {a.name}
                </h2>
                {formatStars(a.stars) && (
                  <span className="text-sm opacity-70 whitespace-nowrap">
                    ★ {formatStars(a.stars)}
                  </span>
                )}
              </div>
              <p className="text-sm opacity-80 my-2">{a.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-60">
                <span>License: {a.license}</span>
                {a.pushedAt && (
                  <span>Last commit: {a.pushedAt.slice(0, 10)}</span>
                )}
              </div>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm underline"
              >
                {a.repo ? "View on GitHub" : "Visit website"}
              </a>
            </li>
          ))}
        </ol>

        <p className="text-xs opacity-50 mt-8">
          Licenses and star counts can change. Check each project before you
          adopt it.
        </p>
      </div>
    </main>
  );
}
