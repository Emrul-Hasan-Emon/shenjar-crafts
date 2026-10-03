# Admin Panel App (PWA)

The Admin Panel is installable as an app, the same way the [Partner Portal](./partner-portal-app.md) is. Admins work
mostly from their phones, so each admin can add Shenjar Admin to their home screen and open it full-screen with its
own icon. It is the same Next.js admin panel, not a separate codebase.

## How it differs from the Partner Portal app

Both apps live on one origin, so they must not step on each other.

| | Partner Portal | Admin Panel |
|---|---|---|
| Manifest | `public/partner-manifest.webmanifest` | `public/admin-manifest.webmanifest` |
| App `id` | defaults to `/partner/login` | `/admin` (explicit, so the two installs stay distinct) |
| `start_url` / `scope` | `/partner/login` / `/` | `/admin` / `/admin` |
| Service worker | `public/partner-sw.js`, scope `/` | `public/admin-sw.js`, scope `/admin` |
| Caching | network-first, caches partner pages | **caches nothing** (see below) |
| Icons | `partner_portal_*.png` | `admin_app_{180,192,512}.png` |
| Registered from | root layout (every page) | `src/app/admin/layout.tsx` (admin pages only) |

The root layout still advertises the Partner manifest to the public site. `src/app/admin/layout.tsx` overrides
`manifest`, `appleWebApp` and `icons` metadata for everything under `/admin`, so "Install" from the admin panel
installs the Admin app. Because the admin worker's scope (`/admin`) is more specific than the partner worker's (`/`),
it controls admin pages even though both are registered.

## Files

- `public/admin-manifest.webmanifest`: name, `id`, `start_url`, `scope`, standalone display, theme colours, icons
  (`any` and `maskable`), and home-screen shortcuts (Dashboard, New Project, Finance, Partners). No orientation lock,
  so tables can be used in landscape.
- `public/admin-sw.js`: the service worker. See "Offline and caching".
- `public/images/admin_app_180.png`, `_192.png`, `_512.png`: the Shenjar logo with an ADMIN pill, so the app is
  distinguishable from the Partner icon on a home screen. Content sits inside the maskable safe zone, so one image
  serves both `any` and `maskable`. Regenerate with `npx tsx server/scripts/generate-admin-icons.ts`.
- `src/app/admin/layout.tsx`: metadata override and the registration component.
- `src/components/pwa/installPrompt.ts`: module-level store that captures the browser's `beforeinstallprompt` event
  as soon as the bundle loads, and exposes `useInstallState()` / `promptInstall()`. Capturing it globally means an
  Install button that mounts later, or after client-side navigation, still works.
- `src/components/pwa/AdminPwaRegistration.tsx`: registers `/admin-sw.js` with scope `/admin` (HTTPS or localhost only).
- `src/components/pwa/InstallAppButton.tsx`: generic install button (takes an `appName`). Opens the native dialog when
  available; otherwise shows platform-specific manual steps. Shows "App installed" once running standalone.
- `src/app/admin/(protected)/install/page.tsx`: the `/admin/install` page, with an Install button and step-by-step
  guides for Android, iPhone/iPad and desktop.
- `src/app/admin/(protected)/_components/AdminInstallBanner.tsx`: dashboard card, shown on phone widths only and
  hidden once the app is installed.

## Where admins find "Install app"

1. **Sidebar / mobile menu**: App → Install app (opens `/admin/install`).
2. **Dashboard**: a banner on phone widths, until installed.
3. **Login page**: a card with an Install button, so an admin can install before signing in.

## Install flow per platform

- **Android (Chrome/Edge)**: tap Install app; the native dialog appears. If the browser hasn't offered it, the button
  shows "Open your browser menu, then choose Install app or Add to Home screen".
- **iPhone/iPad (Safari)**: iOS has no install prompt API. The button shows "Share, then Add to Home Screen", and the
  install page has the full steps. In-app browsers (WhatsApp, Facebook) can't install apps; the page says to open it
  in Safari.
- **Desktop (Chrome/Edge)**: the button or the address-bar install icon.

Each admin installs on their own device and signs in with their own account. Installing does not change
authentication.

## Offline and caching

The admin worker deliberately caches nothing. Every admin page is authenticated business data (finance, customers,
partners) and phones get shared and lost, so no page or API response is written to Cache Storage. The worker only
handles full-page navigations: if the network is unreachable it returns a small "You're offline" page (inlined in
`admin-sw.js`, so another worker's cache cleanup can't evict it). All other requests (data fetches, Supabase calls,
images, scripts) bypass it.

Because it caches nothing, there is no cache version to bump when the panel changes. Deploying new code updates the
app on next launch. If `admin-sw.js` itself changes, browsers pick it up automatically.

Note: `partner-sw.js` deletes every cache that isn't its own on activation. That is harmless today because the admin
worker has no caches, but if admin caching is ever added, scope that cleanup to its own cache-name prefix first.

## Testing checklist

1. `/admin-manifest.webmanifest`, `/admin-sw.js` and the three `admin_app_*.png` files return 200.
2. On `/admin/login`, `<link rel="manifest">` points to the admin manifest; on `/partner/login` and the public site it
   still points to the partner manifest.
3. DevTools → Application: a worker registered with scope `/admin` is activated, and the manifest shows no errors.
4. Install from Android Chrome; the app launches at `/admin`, full-screen, with the ADMIN icon; signed out it lands on
   the login page, signed in on the dashboard.
5. Install from iPhone Safari via Share → Add to Home Screen.
6. After installing, the Install buttons read "App installed" and the dashboard banner disappears.
7. Stop the server (or go offline) and open an admin URL; the "You're offline" page appears and Try again reloads.
8. The Partner Portal app still installs and works, and both apps can be installed side by side.

## Known limits

- Real install prompts need HTTPS (or localhost). They can't be fully exercised on a plain-HTTP LAN address.
- No push notifications and no offline data access. Both are possible later but need their own design, especially for
  auth and data privacy.
- `InstallAppButton` is generic; `PartnerInstallButton` predates it and still has its own copy of the logic.
