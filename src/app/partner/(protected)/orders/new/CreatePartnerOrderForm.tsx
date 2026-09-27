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
      notifyPanel("Order created successfully.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="partner-order-form">
      <section className="partner-form-card">
        <div className="partner-form-section-title">
          <span>1</span>
          <div>
            <h2>Order details</h2>
            <p>Required fields are kept first for faster mobile entry.</p>
          </div>
        </div>
        <div className="partner-form-grid">
          <div>
            <label>Category *</label>
            {categories.length === 0 ? (
              <p className="mt-1 text-sm text-red-600">No categories available yet — ask the shop to add one.</p>
            ) : (
              <select name="category" required defaultValue="">
                <option value="" disabled>
                  Choose category
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
            <label>Order name *</label>
            <input name="name" required placeholder="Example: Wall panel set" />
          </div>
          <div>
            <label>Quantity</label>
            <input name="quantity" type="number" step="any" min="0" inputMode="decimal" placeholder="Optional" />
          </div>
          <div>
            <label>Price per quantity *</label>
            <input name="price" type="number" step="any" min="0" inputMode="decimal" required placeholder="৳" />
          </div>
          <div className="sm:col-span-2">
            <label>Description</label>
            <textarea name="description" rows={2} placeholder="Size, color, material, or special instructions" />
          </div>
          <div>
            <label>Start date</label>
            <input name="estimated_start_time" type="date" />
          </div>
          <div>
            <label>Delivery date</label>
            <input name="estimated_delivery_time" type="date" />
          </div>
        </div>
      </section>

      <section className="partner-form-card">
        <div className="partner-form-section-title">
          <span>2</span>
          <div>
            <h2>Customer details</h2>
            <p>Optional, but useful for delivery and follow-up.</p>
          </div>
        </div>
        <div className="partner-form-grid">
          <div>
            <label>Customer name</label>
            <input name="customer_name" placeholder="Optional" />
          </div>
          <div>
            <label>Gender</label>
            <select name="customer_gender" defaultValue="">
              <option value="">Not set</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label>Mobile number</label>
            <input name="customer_mobile" type="tel" inputMode="tel" placeholder="Optional" />
          </div>
          <div>
            <label>Email</label>
            <input name="customer_email" type="email" placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <label>Address</label>
            <textarea name="customer_address" rows={2} placeholder="Optional" />
          </div>
        </div>
      </section>

      {error ? <p role="alert" className="partner-form-error">{error}</p> : null}

      <div className="partner-form-actions">
        <button type="button" onClick={() => router.back()} className="partner-secondary-button">
          Cancel
        </button>
        <button type="submit" disabled={busy || categories.length === 0} className="partner-submit-button">
          {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
          {busy ? "Creating..." : "Create order"}
        </button>
      </div>
    </form>
  );
}
