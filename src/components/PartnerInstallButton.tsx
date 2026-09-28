"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PartnerInstallButtonProps = {
  className?: string;
  fallbackTargetId?: string;
  children?: ReactNode;
};

export default function PartnerInstallButton({
  className,
  fallbackTargetId = "install-partner-app",
  children = "Install Partner App",
}: PartnerInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;

    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
    );
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMessage(null);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setMessage("Partner Portal is installed on this device.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const showInstallGuide = () => {
    document.getElementById(fallbackTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMessage("If the install prompt does not appear, use the steps below for your browser.");
  };

  const handleInstall = async () => {
    if (isInstalled) {
      setMessage("Partner Portal is already installed on this device.");
      return;
    }

    if (!installPrompt) {
      showInstallGuide();
      return;
    }

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);

      if (choice.outcome === "accepted") {
        setMessage("Partner Portal installation has started.");
        return;
      }

      showInstallGuide();
    } catch {
      showInstallGuide();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={handleInstall} className={className}>
        {isInstalled ? "Partner App Installed" : children}
      </button>
      {message ? <p className="text-xs leading-relaxed text-ink-soft">{message}</p> : null}
    </div>
  );
}
