# Public Website UI & Responsive Design

Updated: 22 September 2026.

## Design goal

Shenjar Crafts should feel like a premium, attractive craft studio: warm, distinctive, and visually engaging, with the work itself at the center. It is a portfolio and custom-project enquiry experience, not an ecommerce checkout.

The accepted direction combines deep navy feature sections, warm cream backgrounds, gold accents, prominent imagery, serif headlines, and restrained card depth. A very minimal ivory treatment was explored but replaced after feedback that it felt flatter than the original. Preserve the richer current direction when extending the site.

## Scope and architecture

The public route group wraps its header, main content, and footer in `.studio-theme` in [`src/app/(site)/layout.tsx`](../src/app/\(site\)/layout.tsx). The public color overrides and layout styles live in [`src/app/globals.css`](../src/app/globals.css).

The base theme remains available outside that wrapper. Admin and standalone invoice pages do not inherit the public theme. Some shared interaction defaults and the earlier admin navigation/spacing improvements apply independently.

These changes do not add checkout, payments, a new database schema, or new authentication behavior. Supabase remains the source for banners, categories, photocards, project media, and About content. Existing URL paths and category query parameters remain valid.

## Color and typography reference

These are the current `.studio-theme` tokens, not the base `:root` palette:

| Token | Value | Purpose |
|---|---|---|
| `cream` | `#F7EFDF` | Main public background |
| `cream-dark` | `#EBDCC3` | Alternate sections and warm surfaces |
| `wood-soft` | `#EFDBB8` | Icon backgrounds and badges |
| `navy` / `ink` | `#162B3C` | Primary text and strong controls |
| `navy-light` | `#28475B` | Secondary navy and hover treatment |
| `wood` | `#995D32` | Rich wood accent |
| `wood-light` | `#D9B77C` | Gold highlights |
| `ink-soft` | `#686052` | Supporting text |
| `ink-dark` | `#102330` | Dark surfaces and image overlays |
| `border` | `#DDCFB9` | Warm dividers |

The hero and page introductions use a deep `#102B3B` background with a subtle radial gradient. The hero headline emphasis uses `#E8C48A`; its primary action uses `#E6BD7B`.

Playfair Display remains the display face and Inter the body face, configured in the root layout. Public display text uses balanced wrapping and slightly tightened letter spacing. Maintain clear contrast and readable body copy rather than shrinking text to increase density.

The public wrapper paints a solid background over the original body texture; the original body pattern still exists in the base styles. Image overlays remain where they help captions stay readable.

## Homepage

Source: [`src/app/(site)/page.tsx`](../src/app/\(site\)/page.tsx).

### Hero

- A deep navy stage establishes a strong first impression immediately beneath the navbar.
- The two-line headline emphasizes “Crafted by us.” in gold italic display type.
- Desktop places the framed banner on the left and the heading, supporting copy, benefits, and actions on the right.
- The banner spans both text rows, extending with the adjacent content instead of imposing a fixed desktop aspect ratio. This avoids the previous large heading-to-bullets gap caused by equal-height rows.
- The image frame includes a collection caption and an Our Work link.
- Primary action: **Discuss Your Project** via WhatsApp. Secondary action: **Explore Our Craft** at `/products`.
- Three short benefits and the “Made for you / Built in Dhaka / Crafted to last” line reinforce the custom-work positioning without invented metrics or testimonials.
- Existing admin-managed banners and the existing fallback image remain in use. No replacement photographs were generated.

Below the hero, a static specialties strip replaces the moving marquee. The rest of the homepage flows through category inspiration, furniture pieces, the studio story, services, project work, a three-step custom-project process, trust information, and the contact call to action.

The story section uses existing project imagery on desktop. Furniture pieces appear before longer business information, making the work easier to discover. Cards regain controlled shadows, rounded corners, and subtle hover lift.

## Other public pages

[`PageIntro.tsx`](../src/components/PageIntro.tsx) provides a reusable navy introduction with a breadcrumb, gold eyebrow, one `h1`, optional supporting text, and a gold bottom border.

| Page | Current treatment |
|---|---|
| `/about` | “Your vision. Our hands.” introduction, existing bilingual About content, warm vision/commitment cards, expertise chips, shared enquiry section. |
| `/services` | “From a single piece to an entire space.” introduction. Numbered service cards have gold top borders, icons, descriptive details, and existing links to matching project categories. Cards form two columns on large screens. |
| `/products` | Publicly labeled **Our Craft**. Navy introduction, category filtering, image-led cards, and the existing detail/enquiry dialog. The URL remains `/products`. |
| `/our-work` | Publicly labeled **Projects**. Matching introduction and filtered photo/video gallery. The URL remains `/our-work`. |
| `/contact` | “Every great piece starts with a conversation.” introduction. Four cards provide WhatsApp, phone, address, and Facebook access. A consultation panel suggests sharing space photos, measurements, and design references; the existing map remains. |

Design Studio remains unlinked from navigation. Its existing route inherits the public theme, but it was not given the full page-introduction redesign in this pass.

## Shared components and interactions

| Component | Responsibility |
|---|---|
| `Header.tsx` | Public navigation, active-page indication, language toggle, desktop contact actions, compact mobile menu. |
| `Container.tsx` | Shared width limit with 16px mobile and 32px larger-screen horizontal padding. |
| `SectionHeading.tsx` | Consistent section eyebrows, headings, and descriptions; page titles belong in `PageIntro`. |
| `CategoryTiles.tsx`, `ServiceCard.tsx` | Reusable visual cards; use `.studio-card` for controlled depth and hover treatment. |
| `ProductsGrid.tsx`, `OurWorkGrid.tsx` | Category state stays in the URL. Mobile filters scroll horizontally; larger screens can wrap them. Two-column mobile galleries retain compact spacing. |
| `OrderModal.tsx` | Native modal dialog with Escape dismissal, browser focus containment, body scroll lock, a bounded scrollable height, and an enlarged close button. “Discuss This Piece” leads to the existing WhatsApp/Facebook options. |
| `CTABand.tsx`, `TrustBand.tsx` | Consistent enquiry and craftsmanship sections using the public palette. |
| `Footer.tsx` | Two-column mobile layout with a full-width brand block, expanding to three columns on larger screens. |

Business enquiry links open the existing external destinations. No message is sent automatically. The EN/BN convention for managed content is retained; newly written static editorial copy remains English.

## Admin and partner panels

The admin and partner workspaces now share the `.panel-theme` design system in [`src/app/globals.css`](../src/app/globals.css), with the shared shell and feedback components in [`src/components/panel`](../src/components/panel). The intent is a quieter SaaS-style workspace: cool neutral surfaces, navy structure, compact cards, consistent controls, and table layouts that remain readable during repeated management work.

[`PanelShell.tsx`](../src/components/panel/PanelShell.tsx) owns the common sidebar, mobile drawer, sticky topbar, account block, sign-out action, active-route state, and skip link. Admin uses broader grouped navigation for finance, partner management, workshop data, and website content. Partner uses the same shell with a narrower navigation set so it feels related to admin without exposing the full system.

[`PanelFeedback.tsx`](../src/components/panel/PanelFeedback.tsx) provides shared toast notifications and destructive-action confirmations. Client-side create, update, delete, upload, and status-change flows use `notifyPanel(...)` for success/error feedback. Destructive actions use `confirmPanel(...)` instead of browser-native confirmation prompts so the experience stays consistent across admin and partner pages.

[`PanelLoading.tsx`](../src/components/panel/PanelLoading.tsx) and [`PanelError.tsx`](../src/components/panel/PanelError.tsx) provide matching loading and error states for both protected route groups. Login pages use the same panel theme wrapper so authentication does not feel visually disconnected from the protected workspace.

Tables that need to work on narrow screens use `.panel-mobile-table` and `data-label` attributes. On desktop they remain conventional tables; below 640px each row becomes a compact labeled card so users can scan more useful information on mobile without horizontal dragging.

## Responsive behavior

- **Below 640px:** reduced section gaps, compact cards, two-column galleries/contact options, and horizontally scrolling category filters. Form controls use 16px text to reduce mobile input zoom.
- **Below 1024px:** the homepage hero stacks heading, banner, and details. The banner uses a compact 2:1 ratio; both main actions remain available.
- **1024px and up:** the hero becomes an image-left/text-right composition; services use a two-column layout.
- **Below 1280px:** the public header uses its compact menu to prevent crowded navigation at tablet widths. At 1280px and up, desktop navigation and contact actions appear.
- The public header is 64px tall in compact mode and 80px in desktop mode. Sticky gallery filters use matching offsets.
- Earlier admin refinements include a sticky mobile bar, a two-column expanded menu, reduced content padding, and a sticky desktop sidebar. These are separate from the public visual redesign.

## Accessibility and motion

The public layout has a skip-to-content link. Shared CSS adds visible keyboard focus, anchor scroll offsets, and reduced-motion overrides for CSS animation/transitions. Menu controls expose expanded state; language and filter buttons expose selection state.

Reduced-motion CSS does not itself stop JavaScript-driven banner rotation. Full carousel accessibility and assistive-technology testing remain separate follow-up work; do not interpret the current styling checks as an accessibility certification.

## Verification and limitations

During implementation, TypeScript (`--noEmit --incremental false`), ESLint, and `git diff --check` passed after fixes. Browser checks included the homepage and updated public pages, mobile layout checks at 390px, and desktop checks at 1440px. Contact and Projects were visually inspected at mobile width; Services was visually inspected at desktop width. Loaded About, Our Craft, and Services pages were also checked for horizontal overflow.

This was local development verification, not a production deployment or a complete browser/device matrix. No new automated test suite was added for these presentation changes. Existing photography and promotional banners were retained, so their composition still affects the final visual quality.

### Manual regression checklist for future changes

1. Check 390px mobile, tablet, and 1440px desktop layouts, plus narrower widths when content changes.
2. Confirm the hero has no oversized navbar gap and its desktop banner tracks the text column height.
3. Open the compact navigation; verify active links, language selection, and contact actions.
4. Filter both galleries; verify URL state, sticky offsets, empty results, and photo/video previews.
5. Open a detail dialog, use keyboard navigation, dismiss with Escape, and confirm background scrolling returns.
6. Verify long names, bilingual content, service anchors, and all four contact destinations.
7. Check reduced-motion preferences and confirm that new UI changes do not affect admin or invoice styling.
