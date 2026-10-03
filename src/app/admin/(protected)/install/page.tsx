import type { Metadata } from "next";
import InstallAppButton from "@/components/pwa/InstallAppButton";

export const metadata: Metadata = { title: "Install the Admin app" };

const STEPS = [
  {
    title: "Android (Chrome or Edge)",
    steps: [
      "Open this page in Chrome and sign in.",
      "Tap Install app above. If no prompt appears, open the browser menu (⋮) and choose “Install app” or “Add to Home screen”.",
      "Confirm. Shenjar Admin now appears on your home screen and opens full-screen.",
    ],
  },
  {
    title: "iPhone or iPad (Safari)",
    steps: [
      "Open this page in Safari. Other browsers and in-app browsers (WhatsApp, Facebook) can't add apps.",
      "Tap the Share button at the bottom of the screen.",
      "Scroll down, tap “Add to Home Screen”, then tap Add.",
    ],
  },
  {
    title: "Desktop (Chrome or Edge)",
    steps: [
      "Click the install icon at the right end of the address bar, or tap Install app above.",
      "Confirm to open the Admin app in its own window.",
    ],
  },
];

export default function AdminInstallPage() {
  return (
    <div className="max-w-2xl">
      <p className="mb-2 text-xs font-semibold tracking-wide text-ink-soft uppercase">Admin app</p>
      <h1 className="font-display text-2xl font-semibold text-navy">Install the Admin app</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Add Shenjar Admin to your phone&apos;s home screen to open it like a normal app: full-screen, with its own icon. Each
        admin installs it on their own device.
      </p>

      <div className="panel-install-card mt-6">
        <div className="min-w-0">
          <strong>Shenjar Admin</strong>
          <p>Free, no app store needed.</p>
        </div>
        <InstallAppButton appName="Shenjar Admin" className="panel-install-btn">Install app</InstallAppButton>
      </div>

      <div className="mt-6 space-y-4">
        {STEPS.map((group) => (
          <section key={group.title} className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-navy">{group.title}</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
              {group.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-ink-soft">
        The app is the same admin panel, so it always shows live data and needs an internet connection. You still sign in with
        your own admin account, and nothing from the panel is stored on the device for offline use.
      </p>
    </div>
  );
}
