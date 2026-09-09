# Shenjar Crafts

Portfolio website for **Shenjar Crafts** — a Dhaka-based custom furniture,
interior, exterior, and electrical solutions studio. Built with Next.js
(App Router), TypeScript, and Tailwind CSS.

This is a portfolio site (no e-commerce yet) meant to give the business a
professional link to share with prospective clients who ask for one.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

## Project structure

- `src/app` — pages (Home, About, Services, Portfolio, Contact)
- `src/components` — shared UI (Header, Footer, cards, gallery, etc.)
- `src/data` — editable content: `site.ts` (contact info/tagline),
  `services.ts` (service list), `gallery.ts` (portfolio items)
- `public/images/portfolio` — portfolio photos

## Adding real portfolio photos

Several gallery entries in `src/data/gallery.ts` currently have
`image: null` and render as a branded "Photo coming soon" placeholder.
To replace one:

1. Drop the photo into `public/images/portfolio/`.
2. Set that entry's `image` field to the new path, e.g.
   `"/images/portfolio/your-photo.jpg"`.

## Deploy

Any Next.js host works (Vercel is the simplest):
`npm run build` then `npm run start`, or connect the repo to Vercel.
