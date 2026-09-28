"use client";

import { useEffect } from "react";

export default function PartnerPwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    navigator.serviceWorker.register("/partner-sw.js", { scope: "/" }).catch(() => {
      // PWA registration is progressive enhancement; the portal should keep working normally.
    });
  }, []);

  return null;
}

