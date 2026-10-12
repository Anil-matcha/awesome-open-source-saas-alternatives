# Contributing

You can add your own project (or any open source project) as an alternative to a paid SaaS app. One SaaS app can have many alternatives, and each one is listed side by side.

## Easiest: open an issue

1. [Open the "Add an open source alternative" form](../../issues/new?template=add-alternative.yml).
2. Fill in the SaaS app, your GitHub repo (`owner/name`) and a one-line description.
3. A bot checks that the repo is public and not archived, then opens a pull request for you. If something is wrong it comments on the issue.

Submit one issue per alternative. To add several alternatives to the same app, open several issues.

## Or: open a pull request

1. Edit [`data.json`](data.json). Add an object to the `alternatives` array of the SaaS app, or add a new app:

   ```json
   {
     "slug": "notion",
     "name": "Notion",
     "category": "Productivity",
     "description": "All-in-one workspace for notes, docs and wikis.",
     "alternatives": [
       { "name": "AppFlowy", "repo": "AppFlowy-IO/AppFlowy", "license": "AGPL-3.0", "description": "Privacy-first Notion alternative." }
     ]
   }
   ```

   Projects without a GitHub repo can use `"repo": null, "url": "https://..."`.
2. Run `node scripts/validate.mjs` and `node scripts/build-readme.mjs`. Don't edit `README.md` by hand.
3. Open the PR. CI checks the data and that the README is up to date.

## Rules

- The project must be genuinely open source, public, and not archived.
- The SaaS app being replaced must be a paid (or freemium) product.
- Descriptions are one plain-text line, 160 characters at most.
- Stars and licenses are refreshed automatically every week.
