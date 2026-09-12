import Image from "next/image";
import { site } from "@/data/site";

export type InvoiceData = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  quantity: number | null;
  price: number;
  total_price: number;
  estimated_start_time: string | null;
  estimated_delivery_time: string | null;
  customer_name: string | null;
  customer_gender: string | null;
  customer_mobile: string | null;
  customer_email: string | null;
  customer_address: string | null;
  status: string | null;
  created_at: string;
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function InvoiceView({ invoice }: { invoice: InvoiceData }) {
  const quantity = invoice.quantity ?? 1;

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-10 print:rounded-none print:border-none print:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Image
            src="/images/logo.png"
            alt={site.name}
            width={56}
            height={56}
            className="rounded-xl"
          />
          <div>
            <p className="font-display text-xl font-bold text-navy">{site.name}</p>
            <p className="mt-1 text-sm text-ink-soft">{site.address}</p>
            <p className="text-sm text-ink-soft">{site.phoneDisplay}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tracking-[0.2em] text-wood uppercase">Invoice</p>
          <p className="mt-1 text-xs text-ink-soft">#{invoice.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-ink-soft">{new Date(invoice.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Billed To</p>
          <p className="mt-1 font-semibold text-navy">{invoice.customer_name ?? "—"}</p>
          {invoice.customer_gender ? <p className="text-ink-soft">{capitalize(invoice.customer_gender)}</p> : null}
          {invoice.customer_mobile ? <p className="text-ink-soft">{invoice.customer_mobile}</p> : null}
          {invoice.customer_email ? <p className="text-ink-soft">{invoice.customer_email}</p> : null}
          {invoice.customer_address ? <p className="text-ink-soft">{invoice.customer_address}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">Delivery</p>
          <p className="text-ink-soft">Start: {invoice.estimated_start_time ?? "—"}</p>
          <p className="text-ink-soft">Delivery: {invoice.estimated_delivery_time ?? "—"}</p>
        </div>
      </div>

      {/* Table layout from sm: up — on narrower screens a 5-column table would
          overflow the page, so a stacked block (below) is used instead. */}
      <table className="mt-8 hidden w-full text-left text-sm sm:table">
        <thead className="border-b border-border text-xs font-semibold tracking-wide text-ink-soft uppercase">
          <tr>
            <th className="pb-2">Item</th>
            <th className="pb-2">Category</th>
            <th className="pb-2">Qty</th>
            <th className="pb-2">Price/Qty</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-3 align-top">
              <p className="font-semibold text-navy">{invoice.name}</p>
              {invoice.description ? <p className="mt-1 text-xs text-ink-soft">{invoice.description}</p> : null}
            </td>
            <td className="py-3 align-top">{invoice.category}</td>
            <td className="py-3 align-top">{quantity}</td>
            <td className="py-3 align-top">৳{invoice.price.toFixed(2)}</td>
            <td className="py-3 text-right align-top font-semibold text-navy">৳{invoice.total_price.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-8 space-y-3 border-t border-border pt-4 text-sm sm:hidden">
        <div>
          <p className="font-semibold text-navy">{invoice.name}</p>
          {invoice.description ? <p className="mt-1 text-xs text-ink-soft">{invoice.description}</p> : null}
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Category</span>
          <span className="font-medium text-navy">{invoice.category}</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Qty</span>
          <span className="font-medium text-navy">{quantity}</span>
        </div>
        <div className="flex justify-between text-ink-soft">
          <span>Price / Qty</span>
          <span className="font-medium text-navy">৳{invoice.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-[12rem]">
          <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-navy">
            <span>Total</span>
            <span>৳{invoice.total_price.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-sm text-ink-soft">
        Thank you for choosing {site.name}.
      </p>
    </div>
  );
}
