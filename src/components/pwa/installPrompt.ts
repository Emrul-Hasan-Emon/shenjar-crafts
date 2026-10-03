"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared install-prompt state for installable panels.
 *
 * Browsers fire `beforeinstallprompt` once per page load, often before any button has mounted. Capturing it
 * at module scope (this module is imported by the always-mounted registration component) means a button
 * rendered later, or after client-side navigation, can still trigger the native install dialog.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type InstallState = {
  /** The browser has offered a native install dialog we can open on click. */
  canPrompt: boolean;
  /** Running as an installed app already (standalone display mode, or iOS home-screen launch). */
  installed: boolean;
  /** iPhone/iPad: no native prompt exists, install is Share → Add to Home Screen in Safari. */
  ios: boolean;
};

const SERVER_STATE: InstallState = { canPrompt: false, installed: false, ios: false };

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let state: InstallState = SERVER_STATE;
const listeners = new Set<() => void>();

function detectInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIos(): boolean {
  // iPadOS 13+ reports itself as a Mac, so also check for a touch screen.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function update(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  state = { canPrompt: false, installed: detectInstalled(), ios: detectIos() };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    update({ canPrompt: true });
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    update({ canPrompt: false, installed: true });
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Opens the native install dialog. Returns the outcome, or null if no prompt is available. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | null> {
  if (!deferredPrompt) return null;
  const prompt = deferredPrompt;
  // A captured prompt can only be used once, whatever the user answers.
  deferredPrompt = null;
  update({ canPrompt: false });
  try {
    await prompt.prompt();
    return (await prompt.userChoice).outcome;
  } catch {
    return null;
  }
}

/** Resolves true as soon as the browser offers an install prompt, or false after `ms`. */
export function waitForPrompt(ms: number): Promise<boolean> {
  if (deferredPrompt) return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = (result: boolean) => {
      clearTimeout(timer);
      listeners.delete(check);
      resolve(result);
    };
    const check = () => {
      if (deferredPrompt) done(true);
    };
    const timer = setTimeout(() => done(false), ms);
    listeners.add(check);
  });
}

/** Plain-language reason the browser isn't offering a one-tap install, so the user isn't left guessing. */
export async function explainNoPrompt(appName: string): Promise<string> {
  const ua = navigator.userAgent;
  if (!window.isSecureContext) {
    return `Automatic install only works on a secure (https://) address, and this page is ${window.location.origin}. Open ${appName} from its https:// address, then try again.`;
  }
  if (/FBAN|FBAV|Instagram|Line\/|; wv\)|WhatsApp|Messenger/i.test(ua)) {
    return `This in-app browser can't install apps. Open this page in Chrome${state.ios ? " or Safari" : ""} and try again.`;
  }
  if (state.ios) {
    return "iPhone and iPad don't allow one-tap install. In Safari, tap the Share button, then “Add to Home Screen”.";
  }
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration("/admin") : undefined;
  if (!registration?.active) {
    return `${appName} is still getting ready. Wait a few seconds and tap Install app again.`;
  }
  return `Your browser hasn't offered to install ${appName} for this page. It may already be installed on this device, or Chrome may be waiting. You can still use the browser menu (⋮) and choose “Install app”.`;
}
