# StudioOne13 — George W. Dawson

Oil and watercolor paintings. The artist's portfolio for George W. Dawson, working from StudioOne13 in Lynchburg, Virginia.

## Stack

- **Astro** static site (parity with `nickdawson_site`)
- **Cloudflare Workers Static Assets** for hosting
- **Sveltia CMS** at `/admin` for image-first content management *(coming next phase)*

## Local dev

```bash
npm install
npm run dev          # local preview at localhost:4321
npm run build        # produces ./dist
npm run preview      # preview the built site
npm run deploy       # build + wrangler deploy
```

## Adding a painting (during build phase — without CMS)

1. Drop the image in `public/paintings/<slug>.jpg`
2. Create `src/content/paintings/<slug>.md` with frontmatter:

```markdown
---
title: "Painting Title"
medium: oil          # or "watercolor"
year: 2024           # optional
dimensions: "12×16 inches"   # optional
image: /paintings/<slug>.jpg
order: 1             # optional — lower numbers appear first
sold: false          # optional
---

Optional description / notes.
```

## After CMS is wired up

George uses the `/admin` URL on his iPhone. Photos from camera roll, four fields per painting, tap publish. No file management.

## Structure

```
src/
├── pages/
│   ├── index.astro          # home (featured painting + welcome)
│   ├── oils.astro           # oil painting gallery
│   ├── watercolors.astro    # watercolor gallery
│   ├── paintings/[...slug].astro   # individual painting page
│   ├── studio.astro         # the studio
│   ├── about.astro          # about George
│   ├── shows.astro          # upcoming shows
│   └── contact.astro        # contact
├── components/
├── layouts/Base.astro
├── styles/global.css
└── content/
    └── paintings/           # one .md file per painting
public/
├── paintings/               # painting images
└── about/                   # other static images (studio photos, etc.)
```
