"use client";

import { useEffect } from "react";
// Imported for its side effect: starts capturing the browser's install prompt as early as possible.
import "./installPrompt";

export default function AdminPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {
      // PWA registration is progressive enhancement; the panel keeps working as a normal website.
    });
  }, []);

  return null;
}
