# Partner Portal App Implementation

The Partner Portal App is an installable web app experience for Shenjar Crafts partners. The goal is to let partners use the partner system from a phone in an app-like way without asking them to repeatedly visit the website through the browser.

This implementation uses a Progressive Web App (PWA) approach. The same Next.js partner portal remains the source of truth, but mobile users can install it to their home screen, open it through a dedicated icon, and land directly in the Partner Portal login flow.

## Goal

Most Shenjar Crafts partners are expected to use mobile devices. The Partner Portal therefore needs to feel simple, professional, and app-like on mobile.

The implementation focuses on these outcomes:

- Give partners a clear public entry point from the main website.
- Explain the partner program before sending users to login.
- Allow supported browsers to install the Partner Portal as an app.
- Open the installed app directly at the partner login page.
- Keep the Partner Portal and the public site on the same codebase.
- Avoid building and maintaining a separate Android or iOS native app at this stage.
- Preserve the existing partner authentication and partner panel functionality.

## User flow

The intended flow is:

1. A visitor opens the main Shenjar Crafts website.
2. The website navigation shows **Partners**.
3. Clicking **Partners** opens `/partners`.
4. The `/partners` page explains the partner program, benefits, and workflow.
5. The user can choose:
   - **Go to Partner Portal** to open `/partner/login`.
   - **Install Partner App** to install the PWA where the browser supports it.
   - **Ask about partnership** to contact Shenjar Crafts through WhatsApp.
6. Once installed, the app opens directly to `/partner/login` from the phone home screen.

## Why PWA was chosen

A PWA is the best fit for the current stage because it gives the business an app-like partner experience without creating a separate native mobile codebase.

Benefits of the PWA approach:

- Faster to launch than a native Android/iOS app.
- Uses the existing Next.js Partner Portal.
- No duplicate UI or business logic.
- Updates are shipped with normal website deployments.
- Android users can install it through Chrome/Edge as an app-like experience.
- iPhone users can add it to the home screen through Safari.

Limitations:

- Browsers do not allow websites to install apps automatically without user action.
- iOS Safari does not expose the same native install prompt as Android Chrome.
- Push notifications and deeper native-device features would need extra work and platform review.
- If Shenjar Crafts later needs Play Store/App Store distribution, a native wrapper or native app can be considered.

## Files added

### `public/partner-manifest.webmanifest`

This is the PWA manifest. It tells the browser how the Partner Portal App should behave after installation.

Key settings:

- `name`: `Shenjar Crafts Partner Portal`
- `short_name`: `Shenjar Partner`
- `start_url`: `/partner/login`
- `id`: `/partner/login`
- `scope`: `/partner`
- `display`: `standalone`
- `orientation`: `portrait`
- `background_color`: `#f5f7fa`
- `theme_color`: `#172e40`

The `start_url` is important because the installed app opens directly to the partner login page. The `scope` is `/partner` (which, as a path prefix, also covers the public `/partners` page) so it does not overlap the separately installable [Admin app](./admin-panel-app.md) under `/admin`. The explicit `id` keeps the app identity stable.

The manifest also defines app shortcuts:

- Partner Dashboard: `/partner`
- My Orders: `/partner/orders`

### `public/partner-sw.js`

This is the service worker for the Partner Portal App.

It currently provides lightweight app-shell caching for:

- `/partner/login`
- `/images/partner_portal_192.png`
- `/images/partner_portal_512.png`

It uses a network-first strategy for partner routes and partner app icons. If the network fails, it falls back to cached content where available.

The cache name is:

```js
shenjar-partner-shell-v1
```

If the cached shell changes significantly in the future, this cache name should be incremented so old cached assets can be replaced cleanly.

### `src/components/PartnerPwaRegistration.tsx`

This client component registers the service worker in the browser.

Important behavior:

- It runs only in browsers that support `navigator.serviceWorker`.
- It registers only on `https:` or `localhost`.
- It registers `/partner-sw.js` with root scope `/`.
- Failures are intentionally ignored because PWA support is progressive enhancement; the portal should still work as a normal web page.

The component is rendered from `src/app/partner/layout.tsx` and the public `/partners` page, not globally, so admins and public visitors never register the Partner worker. The Partner session also uses its own cookie (`sb-partner-auth-token`) so it can run alongside the Admin app; see [`admin-panel-app.md`](./admin-panel-app.md).

### `src/components/PartnerInstallButton.tsx`

This client component handles the app install CTA.

It listens for the browser's `beforeinstallprompt` event. When supported, it stores that event and uses it when the user clicks **Install Partner App**.

Behavior:

- If the app is already installed, the button label changes to **Partner App Installed**.
- If the browser exposes the install prompt, clicking the button opens the native prompt.
- If the browser does not expose the prompt, the page scrolls to the install instructions.
- If the user dismisses the prompt, the page also shows the fallback install guidance.
- When installation completes, it listens for `appinstalled` and updates the message.

This is necessary because browsers require installation to be triggered by a user gesture. The site cannot silently install the app.

### `public/images/partner_portal.png`

This is the main Partner Portal logo supplied for the app and partner marketing page.

### `public/images/partner_portal_180.png`
### `public/images/partner_portal_192.png`
### `public/images/partner_portal_512.png`

These are generated app icon sizes used by the manifest and platform install flows.

The 192px and 512px versions are referenced directly in `partner-manifest.webmanifest`. The 180px version is useful for Apple-style home screen icon support.

### `src/app/(site)/partners/page.tsx`

This is the public Partner Program landing page.

It explains:

- What the partner program is.
- How partners work with customers and Shenjar Crafts.
- Why partners should use the mobile portal.
- How the app can be installed.

It includes three main calls to action:

- **Go to Partner Portal**: links to `/partner/login`.
- **Install Partner App**: uses `PartnerInstallButton`.
- **Ask about partnership**: opens the WhatsApp contact link.

The page also includes Android and iPhone install guidance for browsers that cannot show a native install prompt.

## Files modified

### `src/app/partner/layout.tsx`, `src/components/pwa/partnerMetadata.ts`

The Partner manifest, icons and `PartnerPwaRegistration` are applied by the Partner layout and the public `/partners` page. They were originally in the root layout, but that made the whole site (including `/admin`) advertise the Partner app. The root layout now declares no manifest.

### `src/components/Header.tsx`

The public navigation was updated so the main website shows **Partners** instead of sending users directly to the Partner Portal login page.

The navigation now routes users to `/partners`, which gives them context before they enter or install the portal.

### `src/components/Footer.tsx`

The footer navigation was updated to match the header. It now includes **Partners** and links to `/partners`.

### `src/app/partner/login/page.tsx`

The Partner login page was enhanced with app-install guidance so a partner who lands directly on login can still understand how to add the portal to their phone.

## Install behavior by platform

### Android Chrome / Android Edge

This is the best supported flow.

Expected behavior:

1. User opens `/partners`.
2. User taps **Install Partner App**.
3. Browser shows the native install prompt if the site meets installability requirements.
4. User confirms installation.
5. Partner Portal appears on the home screen.
6. Opening the app launches `/partner/login` in standalone mode.

If the install prompt is not available yet, the button scrolls to the manual install instructions.

### iPhone Safari

iOS does not provide the same `beforeinstallprompt` event used by Android browsers.

Expected behavior:

1. User opens `/partners` in Safari.
2. User follows the instruction: Share button → **Add to Home Screen**.
3. The Partner Portal appears on the home screen.
4. Opening the icon launches the portal like an app.

### Desktop browsers

Desktop browsers may show an install icon in the address bar or may support the install prompt through the button. If the prompt is unavailable, the button falls back to the install guidance section.

## Deployment requirements

For the PWA install experience to work in production, the site must be served over HTTPS.

`localhost` is accepted by browsers for development testing, so local testing can be done at URLs such as:

```txt
http://localhost:3001/partners
```

In production, use the real HTTPS domain.

## Testing checklist

After making changes to the Partner Portal App implementation, verify the following:

1. `/partners` loads successfully.
2. `/partner/login` loads successfully.
3. `/partner-manifest.webmanifest` returns HTTP 200.
4. `/partner-sw.js` returns HTTP 200.
5. `/images/partner_portal_192.png` returns HTTP 200.
6. `/images/partner_portal_512.png` returns HTTP 200.
7. The header and footer **Partners** links route to `/partners`.
8. The **Go to Partner Portal** button routes to `/partner/login`.
9. The **Install Partner App** button either opens the browser install prompt or scrolls to the install instructions.
10. The partner login flow still works normally.
11. The layout remains usable on mobile.

Recommended local checks:

```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js src/components/PartnerInstallButton.tsx src/app/'(site)'/partners/page.tsx src/components/PartnerPwaRegistration.tsx
git diff --check
```

Useful local URL checks:

```txt
http://localhost:3001/partners
http://localhost:3001/partner/login
http://localhost:3001/partner-manifest.webmanifest
http://localhost:3001/partner-sw.js
```

## Maintenance notes

- Keep `start_url` as `/partner/login` unless the partner authentication flow changes.
- Keep `/partners` as the public marketing and installation page.
- If app icon artwork changes, regenerate the 180px, 192px, and 512px icons.
- If service worker cached files change significantly, increment the cache name in `public/partner-sw.js`.
- Do not cache sensitive partner data aggressively. The current service worker is intentionally conservative.
- If offline order creation is required later, it should be designed carefully with authentication, sync conflict handling, and Supabase write retry behavior.
- If push notifications are required later, add a separate notification implementation rather than mixing it into the current lightweight install work.

## Future upgrade options

The PWA is the recommended current solution. If Shenjar Crafts later needs a store-distributed app, there are two likely paths:

1. **Native wrapper around the existing Partner Portal**
   - Faster than a full native rebuild.
   - Can be distributed through Play Store/App Store.
   - Still depends on web portal quality and connectivity.

2. **Full native Android/iOS app**
   - More expensive and slower to maintain.
   - Best if the product needs deep device features, heavy offline work, or advanced push notification behavior.

For the current business need, the PWA gives partners the app-like mobile experience with the least complexity.
