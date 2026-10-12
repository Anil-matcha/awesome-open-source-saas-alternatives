import Navbar from "@/components/Navbar";
import OssIndexClient from "./OssIndexClient";
import { getAllTools, getCategories, BASE_PATH, SITE_URL } from "./lib";

const TITLE = "Open Source Alternatives to Popular Software";
const DESCRIPTION =
  "Find open source alternatives to Notion, Slack, Firebase, Photoshop and more. Compare licenses, GitHub stars and self-hosting options.";

export const metadata = {
  title: { absolute: `${TITLE} | Muapi` },
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BASE_PATH}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${BASE_PATH}`,
    siteName: "Muapi",
    type: "website",
  },
};

export default function OpenSourceAlternativesPage() {
  const tools = getAllTools();
  return (
    <main className="min-h-screen bg-bg-page text-primary-text flex flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-6xl px-4 pt-28 pb-20">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">{TITLE}</h1>
        <p className="opacity-70 max-w-2xl mb-8">{DESCRIPTION}</p>
        <OssIndexClient
          tools={tools}
          categories={getCategories()}
          basePath={BASE_PATH}
        />
      </div>
    </main>
  );
}
