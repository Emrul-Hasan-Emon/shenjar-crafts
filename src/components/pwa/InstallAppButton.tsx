"use client";

import { useState, type ReactNode } from "react";
import { promptInstall, useInstallState } from "./installPrompt";

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

  const manualSteps = ios
    ? "Tap the Share button in Safari, then choose “Add to Home Screen”."
    : "Open your browser menu (⋮), then choose “Install app” or “Add to Home screen”.";

  async function handleInstall() {
    if (installed) return;
    if (!canPrompt) {
      setMessage(manualSteps);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") setMessage(`${appName} is being added to your device.`);
    else setMessage(`No problem. You can install ${appName} later. ${manualSteps}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleInstall} disabled={installed} className={className}>
        {installed ? "App installed" : children}
      </button>
      {installed ? (
        <p role="status" className="text-xs leading-relaxed text-ink-soft">{appName} is installed on this device.</p>
      ) : message ? (
        <p role="status" className="text-xs leading-relaxed text-ink-soft">{message}</p>
      ) : null}
    </div>
  );
}
