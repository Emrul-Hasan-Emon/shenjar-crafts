"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createPartnerAuthUser } from "@server/partners/auth";
import { generateUniquePartnerCode } from "@server/partners/code";
import { createPartner } from "@server/partners/partners";
import type { CommissionDiscountType } from "@server/partners/types";
import { uploadFile, safeFileName } from "@server/supabase/storage";
import { compressImageIfNeeded } from "@/lib/compressImage";
import MediaPreviewInput from "../../_components/MediaPreviewInput";
import Spinner from "@/components/Spinner";

function optionalText(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

export default function CreatePartnerForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const name = String(form.get("name") ?? "").trim();
      const mobile = String(form.get("mobile") ?? "").trim();
      const email = optionalText(form.get("email"));
      const password = String(form.get("password") ?? "");
      const organizationName = optionalText(form.get("organization_name"));
      const institution = optionalText(form.get("institution"));
      const commission = Number(form.get("commission") ?? 0);
      const commissionType = String(form.get("commission_type") ?? "fixed") as CommissionDiscountType;
      const discount = Number(form.get("discount") ?? 0);
      const discountType = String(form.get("discount_type") ?? "fixed") as CommissionDiscountType;
      const isActive = form.get("is_active") === "on";

      if (!name) throw new Error("Name is required");
      if (mobile.replace(/\D/g, "").length < 10) throw new Error("Enter a valid mobile number — it's used for the partner's login");
      if (!password || password.length < 8) throw new Error("Password must be at least 8 characters");
      if (!organizationName && !institution) throw new Error("Provide an organization or an institution (at least one)");
      if (commission < 0) throw new Error("Commission can't be negative");
      if (discount < 0) throw new Error("Discount can't be negative");

      const supabase = createClient();
      const {
        data: { user: adminUser },
      } = await supabase.auth.getUser();
      if (!adminUser) throw new Error("Your admin session has expired — please sign in again and retry.");

      let profilePicturePath: string | null = null;
      const pictureFile = form.get("profile_picture") as File | null;
      if (pictureFile && pictureFile.size > 0) {
        const compressed = await compressImageIfNeeded(pictureFile);
        profilePicturePath = `partners/${safeFileName(compressed.name)}`;
        await uploadFile(supabase, profilePicturePath, compressed, compressed.type);
      }

      const { userId } = await createPartnerAuthUser(mobile, password);
      const code = await generateUniquePartnerCode(supabase);

      await createPartner(supabase, {
        userId,
        code,
        profile: {
          name,
          mobile,
          email,
          organization_name: organizationName,
          institution,
          facebook_link: optionalText(form.get("facebook_link")),
          linkedin_link: optionalText(form.get("linkedin_link")),
          profile_picture_path: profilePicturePath,
          is_active: isActive,
          is_default: true,
        },
        config: {
          commission,
          commission_type: commissionType,
          discount,
          discount_type: discountType,
        },
        createdBy: adminUser.id,
        creatorName: adminUser.email ?? "admin",
      });

      router.push("/admin/partners");
      notifyPanel();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create partner");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Profile</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-navy">Profile Picture — optional</label>
            <div className="mt-1 max-w-[200px]">
              <MediaPreviewInput name="profile_picture" accept="image/*" busy={busy} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Name *</label>
            <input name="name" required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Mobile * (used for login)</label>
            <input name="mobile" type="tel" required className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Email — optional</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Initial Password *</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Organization</label>
            <input
              name="organization_name"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">Institution</label>
            <input name="institution" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <p className="text-xs text-ink-soft sm:col-span-2">Provide at least one of Organization / Institution.</p>
          <div>
            <label className="block text-sm font-medium text-navy">Facebook link</label>
            <input name="facebook_link" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy">LinkedIn link</label>
            <input name="linkedin_link" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-navy sm:col-span-2">
            <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4 rounded border-border" />
            Active (can log in and create Projects)
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Commission &amp; Discount</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Applied to every Project this partner creates (or Admin creates on their behalf). Changing this
          later never affects Projects already created.
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
                defaultValue={0}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <select name="commission_type" className="rounded-lg border border-border px-3 py-2 text-sm">
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
                defaultValue={0}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <select name="discount_type" className="rounded-lg border border-border px-3 py-2 text-sm">
                <option value="fixed">Fixed (৳)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
      >
        {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
        {busy ? "Creating..." : "Create partner"}
      </button>
    </form>
  );
}
