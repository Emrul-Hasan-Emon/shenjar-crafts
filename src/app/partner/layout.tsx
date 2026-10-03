import type { Metadata } from "next";
import type { ReactNode } from "react";
import PartnerPwaRegistration from "@/components/PartnerPwaRegistration";
import { partnerPwaMetadata } from "@/components/pwa/partnerMetadata";

export const metadata: Metadata = partnerPwaMetadata;

export default function PartnerRootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PartnerPwaRegistration />
    </>
  );
}
