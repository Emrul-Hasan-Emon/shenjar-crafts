"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createFinanceRecord, deleteFinanceRecord, updateFinanceRecord } from "@server/db/finance";
import type { FinanceRecord, FinanceType } from "@server/db/finance";

export type CategoryOption = { id: string; name: string };

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : Number(str);
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

export default function FinanceRecordForm({
  type,
  record,
  categories,
}: {
  type: FinanceType;
  record?: FinanceRecord;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProject = type === "project";
  const priceLabel = isProject ? "Price per Quantity" : "Cost";
  const listPath = `/admin/finance/${isProject ? "projects" : "spends"}`;

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
      if (!name) throw new Error("Name is required");
      if (priceRaw === "") throw new Error(`${priceLabel} is required`);
      const price = Number(priceRaw);
      if (Number.isNaN(price)) throw new Error(`${priceLabel} must be a number`);

      const supabase = createClient();
      const input = {
        type,
        category,
        name,
        price,
        description: optionalText(form.get("description")),
        quantity: isProject ? parseOptionalNumber(form.get("quantity")) : null,
        estimated_start_time: isProject ? optionalText(form.get("estimated_start_time")) : null,
        estimated_delivery_time: isProject ? optionalText(form.get("estimated_delivery_time")) : null,
        material_cost: isProject ? parseOptionalNumber(form.get("material_cost")) : null,
        making_cost: isProject ? parseOptionalNumber(form.get("making_cost")) : null,
        customer_name: isProject ? optionalText(form.get("customer_name")) : null,
        customer_gender: isProject
          ? (optionalText(form.get("customer_gender")) as "male" | "female" | "other" | null)
          : null,
        customer_mobile: isProject ? optionalText(form.get("customer_mobile")) : null,
        customer_email: isProject ? optionalText(form.get("customer_email")) : null,
        customer_address: isProject ? optionalText(form.get("customer_address")) : null,
        status: isProject
          ? (optionalText(form.get("status")) as "pending" | "started" | "finished" | "delivered" | null)
          : null,
      };

      const isCreate = !record;
      const saved = record
        ? await updateFinanceRecord(supabase, record.id, input)
        : await createFinanceRecord(supabase, input);

      if (isCreate) {
        router.push(listPath);
      } else {
        router.push(`${listPath}/${saved.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!record) return;
    if (!window.confirm(`Delete "${record.name}"? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteFinanceRecord(createClient(), record.id);
      router.push(listPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">
          {isProject ? "Project Information" : "Spend Information"}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-navy">Category *</label>
            {categories.length === 0 ? (
              <p className="mt-1 text-sm text-red-600">
                No categories yet — create one under Categories first.
              </p>
            ) : (
              <select
                name="category"
                required
                defaultValue={record?.category && categories.some((c) => c.name === record.category) ? record.category : ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
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
            <label className="block text-sm font-medium text-navy">
              {isProject ? "Project Name" : "Name"} *
            </label>
            <input
              name="name"
              required
              defaultValue={record?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy">Description — optional</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={record?.description ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          {isProject ? (
            <div>
              <label className="block text-sm font-medium text-navy">Quantity — optional</label>
              <input
                name="quantity"
                type="number"
                step="any"
                min="0"
                defaultValue={record?.quantity ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-navy">{priceLabel} *</label>
            <input
              name="price"
              type="number"
              step="any"
              min="0"
              required
              defaultValue={record?.price ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          {isProject ? (
            <>
              <div>
                <label className="block text-sm font-medium text-navy">Estimated Start Time — optional</label>
                <input
                  name="estimated_start_time"
                  type="date"
                  defaultValue={record?.estimated_start_time ?? ""}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy">Estimated Delivery Time — optional</label>
                <input
                  name="estimated_delivery_time"
                  type="date"
                  defaultValue={record?.estimated_delivery_time ?? ""}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </>
          ) : null}
        </div>
        {record ? (
          <p className="mt-4 text-sm text-ink-soft">
            Total Price (calculated): <span className="font-semibold text-navy">৳{record.total_price.toFixed(2)}</span>
          </p>
        ) : null}
      </section>

      {isProject ? (
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Cost Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy">Material Cost per Quantity — optional</label>
              <input
                name="material_cost"
                type="number"
                step="any"
                min="0"
                defaultValue={record?.material_cost ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Making Cost per Quantity — optional</label>
              <input
                name="making_cost"
                type="number"
                step="any"
                min="0"
                defaultValue={record?.making_cost ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>
          {record ? (
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-ink-soft">
              <p>
                Total Cost per Quantity:{" "}
                <span className="font-semibold text-navy">
                  {record.total_cost_per_quantity !== null ? `৳${record.total_cost_per_quantity.toFixed(2)}` : "—"}
                </span>
              </p>
              <p>
                Total Cost for All Quantities:{" "}
                <span className="font-semibold text-navy">
                  {record.total_cost_all !== null ? `৳${record.total_cost_all.toFixed(2)}` : "—"}
                </span>
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {isProject ? (
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Customer Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-navy">Customer Name — optional</label>
              <input
                name="customer_name"
                defaultValue={record?.customer_name ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Gender — optional</label>
              <select
                name="customer_gender"
                defaultValue={record?.customer_gender ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">— not set —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Mobile Number — optional</label>
              <input
                name="customer_mobile"
                defaultValue={record?.customer_mobile ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy">Email — optional</label>
              <input
                name="customer_email"
                type="email"
                defaultValue={record?.customer_email ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-navy">Address — optional</label>
              <textarea
                name="customer_address"
                rows={2}
                defaultValue={record?.customer_address ?? ""}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>
      ) : null}

      {isProject ? (
        <section className="rounded-2xl border border-border bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Project Status</h2>
          <div className="mt-4 max-w-xs">
            <select
              name="status"
              defaultValue={record?.status ?? "pending"}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">— not set —</option>
              <option value="pending">Pending</option>
              <option value="started">Started</option>
              <option value="finished">Finished</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={busy || categories.length === 0}
          className="rounded-full bg-wood px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
        >
          {busy ? "Saving..." : record ? "Save changes" : `Create ${isProject ? "project" : "spend"}`}
        </button>

        {record && isProject ? (
          <a
            href={`/admin/finance/projects/${record.id}/invoice`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-wood hover:underline"
          >
            View / Send Invoice →
          </a>
        ) : null}

        {record ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="ml-auto rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            Delete {isProject ? "project" : "spend"}
          </button>
        ) : null}
      </div>
    </form>
  );
}
