"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createPartnerOrder } from "@server/partners/orders";
import Spinner from "@/components/Spinner";

function optionalText(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

export default function CreatePartnerOrderForm({
  partnerId,
  categories,
}: {
  partnerId: string;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const category = String(form.get("category") ?? "").trim();
      const name = String(form.get("name") ?? "").trim();
      const priceRaw = String(form.get("price") ?? "").trim();
      if (!category) throw new Error("Category is required");
      if (!name) throw new Error("Order name is required");
      if (priceRaw === "") throw new Error("Price per quantity is required");
      const price = Number(priceRaw);
      if (Number.isNaN(price)) throw new Error("Price must be a number");

      const supabase = createClient();
      await createPartnerOrder(supabase, partnerId, {
        category,
        name,
        price,
        quantity: (() => {
          const q = String(form.get("quantity") ?? "").trim();
          return q === "" ? null : Number(q);
        })(),
        description: optionalText(form.get("description")),
        estimated_start_time: optionalText(form.get("estimated_start_time")),
        estimated_delivery_time: optionalText(form.get("estimated_delivery_time")),
        customer_name: optionalText(form.get("customer_name")),
        customer_gender: optionalText(form.get("customer_gender")) as "male" | "female" | "other" | null,
        customer_mobile: optionalText(form.get("customer_mobile")),
        customer_email: optionalText(form.get("customer_email")),
        customer_address: optionalText(form.get("customer_address")),
      });

      router.push(`/partner/orders`);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Order Information</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-navy">Category *</label>
            {categories.length === 0 ? (
              <p className="mt-1 text-sm text-red-600">No categories available yet — ask the shop to add one.</p>
            ) : (
              <select name="category" required defaultValue="" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Order Name *</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy">Description — optional</label>
            <textarea name="description" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Quantity — optional</label>
            <input name="quantity" type="number" step="any" min="0" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Price per Quantity *</label>
            <input
              name="price"
              type="number"
              step="any"
              min="0"
              required
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Estimated Start Time — optional</label>
            <input name="estimated_start_time" type="date" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Estimated Delivery Time — optional</label>
            <input name="estimated_delivery_time" type="date" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Customer Information</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-navy">Customer Name — optional</label>
            <input name="customer_name" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Gender — optional</label>
            <select name="customer_gender" defaultValue="" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
              <option value="">— not set —</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Mobile Number — optional</label>
            <input name="customer_mobile" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Email — optional</label>
            <input name="customer_email" type="email" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy">Address — optional</label>
            <textarea name="customer_address" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={busy || categories.length === 0}
        className="inline-flex items-center gap-2 rounded-full bg-wood px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
      >
        {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
        {busy ? "Creating..." : "Create order"}
      </button>
    </form>
  );
}
