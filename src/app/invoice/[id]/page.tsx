import type { Metadata } from "next";
import { createClient } from "@server/supabase/server-client";
import { getPublicInvoice } from "@server/db/finance";
import InvoiceView from "@/components/InvoiceView";
import PrintButton from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const invoice = await getPublicInvoice(supabase, id);

  if (!invoice) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-dark/30 px-6 text-center">
        <p className="text-ink-soft">This invoice link is invalid or no longer available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-dark/30 px-6 py-12">
      <InvoiceView invoice={invoice} />
      <div className="mx-auto mt-6 max-w-2xl text-center print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}
