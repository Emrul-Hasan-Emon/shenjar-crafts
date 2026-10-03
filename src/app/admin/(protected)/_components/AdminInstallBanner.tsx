"use client";

import Link from "next/link";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import { useInstallState } from "@/components/pwa/installPrompt";

/** Dashboard prompt for phone users. Hidden on desktop widths, and once the app is installed. */
export default function AdminInstallBanner() {
  const { installed } = useInstallState();
  if (installed) return null;

  return (
    <div className="panel-install-card mt-6 md:hidden">
      <div className="min-w-0">
        <strong>Get the Admin app</strong>
        <p>
          Add Shenjar Admin to your home screen for one-tap access.{" "}
          <Link href="/admin/install" className="font-semibold text-[#245a72] underline">How it works</Link>
        </p>
      </div>
      <InstallAppButton appName="Shenjar Admin" className="panel-install-btn">Install app</InstallAppButton>
    </div>
  );
}
