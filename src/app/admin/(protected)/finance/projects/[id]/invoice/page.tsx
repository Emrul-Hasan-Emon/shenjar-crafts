import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createClient } from "@server/supabase/server-client";
import { getFinanceRecordById } from "@server/db/finance";
import InvoiceView from "@/components/InvoiceView";
import InvoiceActions from "./InvoiceActions";

export default async function ProjectInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const record = await getFinanceRecordById(supabase, id);
  if (!record || record.type !== "project") notFound();

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/invoice/${record.id}`;

  return (
    <div>
      <div className="print:hidden">
        <Link href={`/admin/finance/projects/${record.id}`} className="text-sm font-semibold text-wood hover:underline">
          ← Back to project
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold text-navy">Invoice</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Customer-facing only — material cost, making cost, and internal cost totals are never shown here.
        </p>
      </div>

      <div className="mt-8">
        <InvoiceView
          invoice={{
            id: record.id,
            category: record.category,
            name: record.name,
            description: record.description,
            quantity: record.quantity,
            price: record.price,
            total_price: record.total_price,
            estimated_start_time: record.estimated_start_time,
            estimated_delivery_time: record.estimated_delivery_time,
            customer_name: record.customer_name,
            customer_gender: record.customer_gender,
            customer_mobile: record.customer_mobile,
            customer_email: record.customer_email,
            customer_address: record.customer_address,
            status: record.status,
            created_at: record.created_at,
          }}
        />
      </div>

      <div className="print:hidden">
        <InvoiceActions
          publicUrl={publicUrl}
          customerMobile={record.customer_mobile}
          projectName={record.name}
        />
      </div>
    </div>
  );
}
