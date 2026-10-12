// Merges grouped.json (from group-mined.mjs) into data.json, restricted to an
// allowlist of paid SaaS products. Existing tools gain new alternatives.
// Usage: node scripts/merge-mined.mjs <grouped.json>
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const grouped = JSON.parse(await readFile(process.argv[2], "utf8"));
const data = JSON.parse(await readFile(new URL("data.json", root), "utf8"));

// mined name -> [display name, category, one-line description]
const SAAS = {
  "Postman": ["Postman", "Developer Tools"], "Insomnia": ["Insomnia", "Developer Tools"],
  "Vercel": ["Vercel", "Developer Tools"], "Heroku": ["Heroku", "Developer Tools"],
  "Netlify": ["Netlify", "Developer Tools"], "Salesforce": ["Salesforce", "CRM"],
  "Intercom": ["Intercom", "Customer Support"], "Zendesk": ["Zendesk", "Customer Support"],
  "Linear": ["Linear", "Project Management"], "Jira": ["Jira", "Project Management"],
  "Slack": ["Slack", "Communication"], "Notion": ["Notion", "Productivity"],
  "Algolia": ["Algolia", "Developer Tools"], "Pinecone": ["Pinecone", "Developer Tools"],
  "Trello": ["Trello", "Project Management"], "Asana": ["Asana", "Project Management"],
  "Tableau": ["Tableau", "Analytics"], "Semrush": ["Semrush", "Marketing"],
  "Ahrefs": ["Ahrefs", "Marketing"], "Datadog": ["Datadog", "Monitoring"],
  "Splunk": ["Splunk", "Monitoring"], "Confluence": ["Confluence", "Productivity"],
  "Google Analytics": ["Google Analytics", "Analytics"], "Retool": ["Retool", "Developer Tools"],
  "Auth0": ["Auth0", "Developer Tools"], "Firebase Auth": ["Firebase Auth", "Developer Tools"],
  "AWS Cognito": ["AWS Cognito", "Developer Tools"], "Evernote": ["Evernote", "Productivity"],
  "Pubnub": ["PubNub", "Developer Tools"], "Pusher": ["Pusher", "Developer Tools"],
  "Ably": ["Ably", "Developer Tools"], "Clerk": ["Clerk", "Developer Tools"],
  "WorkOS": ["WorkOS", "Developer Tools"], "Stytch": ["Stytch", "Developer Tools"],
  "Webflow": ["Webflow", "Design"], "Framer": ["Framer", "Design"],
  "Twilio": ["Twilio", "Communication"], "Mixpanel": ["Mixpanel", "Analytics"],
  "Superwhisper": ["Superwhisper", "AI"], "Wispr Flow": ["Wispr Flow", "AI"],
  "Vapi": ["Vapi", "AI"], "Retell": ["Retell AI", "AI"], "Opus Clip": ["Opus Clip", "Video"],
  "Resend": ["Resend", "Marketing"], "Sendgrid": ["SendGrid", "Marketing"],
  "Mailgun": ["Mailgun", "Marketing"], "Kommo": ["Kommo", "CRM"],
  "Shodan": ["Shodan", "Security"], "Censys": ["Censys", "Security"],
  "SurveyMonkey": ["SurveyMonkey", "Forms"], "Quickbooks": ["QuickBooks", "Finance"],
  "Xero": ["Xero", "Finance"], "Typeform": ["Typeform", "Forms"], "Qualtrics": ["Qualtrics", "Forms"],
  "Drift": ["Drift", "Customer Support"], "Crisp": ["Crisp", "Customer Support"],
  "Zoom": ["Zoom", "Communication"], "Google Meet": ["Google Meet", "Communication"],
  "Microsoft Teams": ["Microsoft Teams", "Communication"], "Splitwise": ["Splitwise", "Finance"],
  "YNAB": ["YNAB", "Finance"], "Otter": ["Otter.ai", "AI"], "Granola": ["Granola", "AI"],
  "Fireflies": ["Fireflies.ai", "AI"], "Cypress Dashboard": ["Cypress Cloud", "Developer Tools"],
  "Discord": ["Discord", "Communication"], "Braze": ["Braze", "Marketing"],
  "One Signal": ["OneSignal", "Marketing"], "Customer Io": ["Customer.io", "Marketing"],
  "Appcues": ["Appcues", "Product"], "Pendo": ["Pendo", "Product"], "Userflow": ["Userflow", "Product"],
  "Higgsfield": ["Higgsfield", "AI"], "OpenArt": ["OpenArt", "AI"], "Freepik": ["Freepik", "AI"],
  "Buffer": ["Buffer", "Marketing"], "Sendible": ["Sendible", "Marketing"],
  "SocialPilot": ["SocialPilot", "Marketing"], "CleanShot X": ["CleanShot X", "Video"],
  "Loom": ["Loom", "Video"], "Ngrok": ["ngrok", "Developer Tools"],
  "NotebookLM": ["NotebookLM", "AI"], "ClickUp": ["ClickUp", "Project Management"],
  "Monday": ["Monday.com", "Project Management"], "Thinkific": ["Thinkific", "Education"],
  "Teachable": ["Teachable", "Education"], "Podia": ["Podia", "Education"],
  "Mailchimp": ["Mailchimp", "Marketing"], "Genspark AI": ["Genspark", "AI"],
  "Firebase Crashlytics": ["Firebase Crashlytics", "Monitoring"],
  "Apollo Studio": ["Apollo GraphOS", "Developer Tools"], "Screaming Frog": ["Screaming Frog", "Marketing"],
  "Zapier": ["Zapier", "Automation"], "Composio": ["Composio", "Automation"],
  "Nango": ["Nango", "Automation"], "Merge": ["Merge", "Automation"],
  "Sentry": ["Sentry", "Monitoring"], "Pingdom": ["Pingdom", "Monitoring"],
  "Carta": ["Carta", "Finance"], "Glean": ["Glean", "AI"], "LinkTree": ["Linktree", "Marketing"],
  "Disqus": ["Disqus", "Publishing"], "Manus": ["Manus", "AI"], "Cluely": ["Cluely", "AI"],
  "Final Round AI": ["Final Round AI", "AI"], "Krea Nodes": ["Krea", "AI"],
  "FloraFauna AI": ["FloraFauna AI", "AI"], "Weavy AI": ["Weavy", "AI"],
  "ChatGPT": ["ChatGPT", "AI"], "Elasticsearch": ["Elastic Cloud", "Developer Tools"],
};

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const find = (display) => data.find((t) => t.slug === slugify(display) || norm(t.name).includes(norm(display)) || norm(display).includes(norm(t.name)));

let added = 0, newTools = 0;
for (const g of grouped) {
  const meta = SAAS[g.name];
  if (!meta) continue;
  const [display, category] = meta;
  const alts = g.alternatives
    .filter((a) => a.stars >= 500 && norm(a.repo.split("/")[1]) !== norm(display))
    .map((a) => ({
      name: a.repo.split("/")[1], repo: a.repo, license: a.license || "See repo",
      description: (a.description || "").replace(/\s+/g, " ").slice(0, 160),
    }));
  if (!alts.length) continue;
  let tool = find(display);
  if (!tool) {
    tool = { slug: slugify(display), name: display, category, description: `${display}: paid SaaS product.`, alternatives: [] };
    data.push(tool); newTools++;
  }
  const have = new Set(tool.alternatives.map((a) => (a.repo || "").toLowerCase()));
  for (const a of alts) if (!have.has(a.repo.toLowerCase())) { tool.alternatives.push(a); added++; }
}
// Not SaaS software: drop consumer media entries from the seed list.
const keep = data.filter((t) => !["netflix", "spotify"].includes(t.slug));
await writeFile(new URL("data.json", root), JSON.stringify(keep, null, 1) + "\n");
console.log(`new tools: ${newTools}, alternatives added: ${added}, total tools: ${keep.length}`);
