"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { setPartnerActive, updatePartnerProfile } from "@server/partners/partners";
import { updatePartnerConfig } from "@server/partners/config";
import type { CommissionDiscountType, PartnerWithConfig } from "@server/partners/types";
import { getPublicUrl, uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import MediaPreviewInput from "../../_components/MediaPreviewInput";
import Spinner from "@/components/Spinner";

function optionalText(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

async function currentAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Your admin session has expired — please sign in again and retry.");
  return { supabase, id: user.id, name: user.email ?? "admin" };
}

export default function PartnerDetail({ partner }: { partner: PartnerWithConfig }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = partner.config;

  async function handleToggleActive() {
    setBusy(true);
    setError(null);
    try {
      const { supabase, id, name } = await currentAdmin();
      await setPartnerActive(supabase, partner.id, !partner.is_active, id, name);
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  async function handleProfileSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const mobile = String(form.get("mobile") ?? "").trim();
      const organizationName = optionalText(form.get("organization_name"));
      const institution = optionalText(form.get("institution"));
      if (!name) throw new Error("Name is required");
      if (!mobile) throw new Error("Mobile is required");
      if (!organizationName && !institution) throw new Error("Provide an organization or an institution (at least one)");

      const { supabase, id, name: adminName } = await currentAdmin();

      let profilePicturePath: string | undefined;
      const pictureFile = form.get("profile_picture") as File | null;
      if (pictureFile && pictureFile.size > 0) {
        const compressed = await compressImageIfNeeded(pictureFile);
        profilePicturePath = `partners/${safeFileName(compressed.name)}`;
        await uploadFile(supabase, profilePicturePath, compressed, compressed.type);
      }

      await updatePartnerProfile(
        supabase,
        partner.id,
        {
          name,
          mobile,
          email: optionalText(form.get("email")),
          organization_name: organizationName,
          institution,
          facebook_link: optionalText(form.get("facebook_link")),
          linkedin_link: optionalText(form.get("linkedin_link")),
          ...(profilePicturePath ? { profile_picture_path: profilePicturePath } : {}),
        },
        id,
        adminName
      );
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfigSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const commission = Number(form.get("commission") ?? 0);
      const discount = Number(form.get("discount") ?? 0);
      if (commission < 0) throw new Error("Commission can't be negative");
      if (discount < 0) throw new Error("Discount can't be negative");

      const { supabase, id, name } = await currentAdmin();
      await updatePartnerConfig(
        supabase,
        partner.id,
        {
          commission,
          commission_type: String(form.get("commission_type") ?? "fixed") as CommissionDiscountType,
          discount,
          discount_type: String(form.get("discount_type") ?? "fixed") as CommissionDiscountType,
        },
        id,
        name
      );
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            partner.is_active ? "bg-wood-soft text-wood" : "bg-cream-dark text-ink-soft"
          }`}
        >
          {partner.is_active ? "Active" : "Inactive"}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={handleToggleActive}
          className="rounded-full border border-navy/15 px-4 py-1.5 text-sm font-semibold text-navy hover:bg-cream-dark disabled:opacity-50"
        >
          {partner.is_active ? "Deactivate" : "Activate"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Total Orders</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{config?.total_orders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Delivered</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">{config?.total_delivered_orders ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Commission Earned</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">৳{(config?.total_commission ?? 0).toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-6">
          <p className="text-xs font-semibold tracking-wide text-wood uppercase sm:text-sm">Customer Discount</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy sm:text-3xl">৳{(config?.total_discount ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <form onSubmit={handleProfileSave} className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Profile</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy">Profile Picture — optional</label>
            <div className="mt-1 max-w-[200px]">
              <MediaPreviewInput
                name="profile_picture"
                accept="image/*"
                busy={busy}
                existingUrl={partner.profile_picture_path ? getPublicUrl(createClient(), partner.profile_picture_path) : null}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Name *</label>
            <input
              name="name"
              required
              defaultValue={partner.name}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Mobile *</label>
            <input
              name="mobile"
              required
              defaultValue={partner.mobile}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={partner.email ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div />
          <div>
            <label className="block text-sm font-medium text-navy">Organization</label>
            <input
              name="organization_name"
              defaultValue={partner.organization_name ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Institution</label>
            <input
              name="institution"
              defaultValue={partner.institution ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Facebook link</label>
            <input
              name="facebook_link"
              defaultValue={partner.facebook_link ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">LinkedIn link</label>
            <input
              name="linkedin_link"
              defaultValue={partner.linkedin_link ?? ""}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
          Save profile
        </button>
      </form>

      <form onSubmit={handleConfigSave} className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Commission &amp; Discount</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Only affects Projects created from now on — Projects already created keep the rate that applied
          when they were made.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-navy">Commission *</label>
            <div className="mt-1 flex gap-2">
              <input
                name="commission"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={config?.commission ?? 0}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <select
                name="commission_type"
                defaultValue={config?.commission_type ?? "fixed"}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="fixed">Fixed (৳)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Discount *</label>
            <div className="mt-1 flex gap-2">
              <input
                name="discount"
                type="number"
                step="any"
                min="0"
                required
                defaultValue={config?.discount ?? 0}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <select
                name="discount_type"
                defaultValue={config?.discount_type ?? "fixed"}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="fixed">Fixed (৳)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
          Save configuration
        </button>
      </form>
    </div>
  );
}
