"use client";

import { useState, type ReactNode } from "react";
import { explainNoPrompt, promptInstall, useInstallState, waitForPrompt } from "./installPrompt";

export default function InstallAppButton({
  appName,
  className,
  children = "Install app",
}: {
  appName: string;
  className?: string;
  children?: ReactNode;
}) {
  const { canPrompt, installed, ios } = useInstallState();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const manualSteps = ios
    ? "Tap the Share button in Safari, then choose “Add to Home Screen”."
    : "Open your browser menu (⋮), then choose “Install app” or “Add to Home screen”.";

  async function handleInstall() {
    if (installed || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      // The browser can take a moment to offer the prompt after the page loads; give it a short grace period.
      // Keep it brief so the tap still counts as a user gesture when we open the native dialog.
      if (!canPrompt && !ios && !(await waitForPrompt(1500))) {
        setMessage(await explainNoPrompt(appName));
        return;
      }
      if (ios) {
        setMessage(await explainNoPrompt(appName));
        return;
      }
      const outcome = await promptInstall();
      if (outcome === "accepted") setMessage(`${appName} is being added to your device.`);
      else setMessage(`Install cancelled. Tap Install app whenever you want to add ${appName}. ${manualSteps}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleInstall} disabled={installed || busy} className={className}>
        {installed ? "App installed" : busy ? "Checking…" : children}
      </button>
      {installed ? (
        <p role="status" className="text-xs leading-relaxed text-ink-soft">{appName} is installed on this device.</p>
      ) : message ? (
        <p role="status" className="text-xs leading-relaxed text-ink-soft">{message}</p>
      ) : null}
    </div>
  );
}
