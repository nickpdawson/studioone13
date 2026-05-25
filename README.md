# StudioOne13 — George W. Dawson

Oil and watercolor paintings. The artist's portfolio for George W. Dawson, working from StudioOne13 in Lynchburg, Virginia.

## Stack

- **Astro** static site (parity with `nickdawson_site`)
- **Cloudflare Workers Static Assets** for hosting
- **Sveltia CMS** at `/admin` — phone-friendly content management, GitHub-backed
- A small **Cloudflare Worker** at `/auth` handles GitHub OAuth so the CMS can read/write the repo without anyone having to think about git

## Local dev

```bash
npm install
npm run dev          # local preview at localhost:4321
npm run build        # produces ./dist
npm run preview      # preview the built site
npm run deploy       # build + wrangler deploy
```

Note: `astro dev` only serves the static site. The `/admin` auth flow requires a deployed Worker, since OAuth needs a real callback URL. Use the live URL to test the CMS.

---

## CMS setup (one-time, Nick does this)

The admin UI at `/admin` is already deployed. To make it actually log in and write to GitHub, three things need to happen:

### 1. Register a GitHub OAuth App

1. Go to <https://github.com/settings/developers> → **New OAuth App**
2. Settings:
   - **Application name:** `StudioOne13 CMS`
   - **Homepage URL:** `https://one13studio.com` *(or the live workers.dev URL until DNS migrates)*
   - **Authorization callback URL:** `https://one13studio.com/auth/callback` *(must match exactly)*
3. Save → note the **Client ID** (public) and generate a **Client Secret** (private)

### 2. Wire the credentials into the Worker

```bash
# Public — edit wrangler.toml and set:
#   [vars]
#   GITHUB_CLIENT_ID = "<the client id from step 1>"

# Private — set as a Worker secret:
npx wrangler secret put GITHUB_CLIENT_SECRET
# (paste the client secret when prompted)

# Redeploy so the new env vars take effect:
npm run deploy
```

### 3. Create Dad's GitHub account + invite as collaborator

1. Create a GitHub account using an email George has access to (e.g. his Apple ID address). Username: `gwdawson` or similar.
2. In this repo's settings → **Collaborators** → invite that account with **Write** access.
3. Have George accept the invite (clicks a link in the email).

After all three are done, George visits `https://one13studio.com/admin/` on his iPhone, taps **Sign in with GitHub**, signs into his account once, and from then on the session keeps him signed in.

---

## How George adds a painting (after CMS setup)

1. Open `https://one13studio.com/admin/` on iPhone (add to Home Screen for one-tap)
2. Tap **+ New Painting**
3. Tap **Painting photo** → pick from camera roll
4. Fill: **Title**, **Medium** (oil/watercolor), and optionally **Year**, **Dimensions**
5. Tap **Publish**
6. ~30 seconds later the painting appears on the gallery page

To remove: open the painting, tap **Delete**, confirm.

---

## Adding content via files (without the CMS, for development)

If editing locally instead of through the CMS:

1. Drop the image in `public/paintings/<slug>.jpg`
2. Create `src/content/paintings/<slug>.md` with frontmatter:

```markdown
---
title: "Painting Title"
medium: oil          # or "watercolor"
year: 2024
dimensions: "12×16 inches"
image: /paintings/<slug>.jpg
order: 1             # optional — lower numbers appear first
sold: false
featured: false      # set true to show on the home page
---

Optional description / notes.
```

## Structure

```
src/
├── worker.js                # Cloudflare Worker entry (OAuth + asset fallthrough)
├── pages/
│   ├── index.astro          # home (featured painting + welcome)
│   ├── oils.astro           # oil painting gallery
│   ├── watercolors.astro    # watercolor gallery
│   ├── paintings/[...slug].astro   # individual painting page
│   ├── studio.astro
│   ├── about.astro
│   ├── shows.astro
│   └── contact.astro
├── components/
├── layouts/Base.astro
├── styles/global.css
└── content/
    ├── paintings/           # one .md file per painting (CMS writes here)
    └── shows/               # one .md file per show
public/
├── admin/
│   ├── index.html           # Sveltia CMS loader
│   └── config.yml           # CMS configuration (collections, fields)
└── paintings/               # painting images (CMS uploads here)
```
