# Design Studio (public sketch → AI concept tool)

A public-facing tool that lets a visitor sketch a rough furniture idea (or upload a reference photo) and a
text prompt, and get back an AI-generated concept render. **Built, then intentionally hidden from
navigation** pending a decision on a paid AI image provider — the code is fully working and still live at
the URL, just not linked anywhere a visitor would find it.

## Why it's hidden

The current implementation uses Pollinations.ai's **free** text-to-image API, which has real limitations
(queueing/slowness on the free tier, no image-to-image support on the free plan — see below). It was built
as a working proof of concept, not the final version. The shop asked to hide it from navigation until a
real (likely paid) AI provider is chosen, rather than ship the free-tier experience to customers. No further
action is expected here unless that decision is revisited — the page and API route are left in place,
untouched, ready to point at a different provider later.

## How it works today

- **`src/app/(site)/design-studio/page.tsx` + `DesignStudioCanvas.tsx`** — a canvas with Pen/Eraser/Undo/
  Clear tools, an "Upload Photo" toggle mode, and a prompt textarea.
- **The sketch and any uploaded photo are reference-only and never sent to the AI.** Pollinations' free
  tier only supports text-to-image right now — its image-to-image ("kontext") model was moved behind a
  paid tier — so generation is driven entirely by the text prompt. The sketch/photo help the visitor
  compose their idea but have no effect on the output.
- **`src/app/api/design-studio/generate/route.ts`** — a Next.js Route Handler that calls
  `https://image.pollinations.ai/prompt/<prompt>` with a fixed style suffix
  (`", photorealistic 3D product render, studio lighting, clean neutral background"`) appended, the `flux`
  model, `1024×1024`, and a random seed. `maxDuration = 60` is set because Pollinations' free tier can be
  slow to respond. The returned image is fetched server-side and re-served as a base64 data URL (no image
  storage — nothing is persisted).

## The seed bug (fixed)

The route originally seeded requests with `Date.now()`. Pollinations (and Postgres 32-bit `int` limits
generally) require a seed that fits in a signed 32-bit integer; `Date.now()` overflows that, so every
single request failed with a 500. Fixed by seeding with
`Math.floor(Math.random() * 2147483647)` instead — a random value that always fits.

## Re-enabling it

The nav link was removed from `src/components/Header.tsx` (commented as intentionally hidden) — the page
still exists and works at `/design-studio`. To bring it back: re-add the nav link, and decide whether to
keep Pollinations or swap `generate/route.ts` to call a paid provider (which would likely also unlock real
image-to-image, letting the sketch/photo actually influence the output instead of being reference-only).
