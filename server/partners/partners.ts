import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Partner,
  PartnerCommissionDiscountInput,
  PartnerConfig,
  PartnerProfileInput,
  PartnerWithConfig,
} from "./types";

const PAGE_SIZE = 20;

function withConfig(row: Partner & { partner_configs: PartnerConfig[] | PartnerConfig | null }): PartnerWithConfig {
  const { partner_configs, ...partner } = row;
  const config = Array.isArray(partner_configs) ? partner_configs[0] : partner_configs;
  return { ...(partner as Partner), config: config as PartnerConfig };
}

/** Postgres unique_violation / foreign_key_violation -> a friendly message. */
function rethrowFriendly(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new Error("A partner with this code or user already exists.");
  }
  if (error.code === "23503") {
    throw new Error("Can't delete this partner — they already have Projects on record. Deactivate them instead.");
  }
  throw error;
}

export type ListPartnersOptions = {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
};

export async function listPartners(
  supabase: SupabaseClient,
  opts: ListPartnersOptions = {}
): Promise<{ data: PartnerWithConfig[]; count: number }> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("partners")
    .select("*, partner_configs(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (opts.isActive !== undefined) query = query.eq("is_active", opts.isActive);
  if (opts.search?.trim()) {
    const term = opts.search.trim();
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data as Array<Partner & { partner_configs: PartnerConfig[] }>).map(withConfig), count: count ?? 0 };
}

export async function getPartner(supabase: SupabaseClient, id: string): Promise<PartnerWithConfig | null> {
  const { data, error } = await supabase
    .from("partners")
    .select("*, partner_configs(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? withConfig(data as Partner & { partner_configs: PartnerConfig[] }) : null;
}

/** Used by the partner panel to fetch "my own" row — scoped by user_id, on
 * top of (not instead of) the "partner read own row" RLS policy. */
export async function getPartnerByUserId(supabase: SupabaseClient, userId: string): Promise<PartnerWithConfig | null> {
  const { data, error } = await supabase
    .from("partners")
    .select("*, partner_configs(*)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? withConfig(data as Partner & { partner_configs: PartnerConfig[] }) : null;
}

export type CreatePartnerInput = {
  userId: string;
  code: string;
  profile: PartnerProfileInput;
  config: PartnerCommissionDiscountInput;
  createdBy: string;
  creatorName: string;
};

/** Creates the partners + partner_configs rows atomically via the create_partner() function. */
export async function createPartner(supabase: SupabaseClient, input: CreatePartnerInput): Promise<Partner> {
  const { data, error } = await supabase.rpc("create_partner", {
    p_user_id: input.userId,
    p_code: input.code,
    p_name: input.profile.name,
    p_mobile: input.profile.mobile,
    p_email: input.profile.email ?? null,
    p_organization_name: input.profile.organization_name ?? null,
    p_institution: input.profile.institution ?? null,
    p_facebook_link: input.profile.facebook_link ?? null,
    p_linkedin_link: input.profile.linkedin_link ?? null,
    p_profile_picture_path: input.profile.profile_picture_path ?? null,
    p_is_active: input.profile.is_active ?? true,
    p_is_default: input.profile.is_default ?? true,
    p_commission: input.config.commission,
    p_commission_type: input.config.commission_type,
    p_discount: input.config.discount,
    p_discount_type: input.config.discount_type,
    p_created_by: input.createdBy,
    p_creator_name: input.creatorName,
  });
  if (error) rethrowFriendly(error);
  return data as Partner;
}

export async function updatePartnerProfile(
  supabase: SupabaseClient,
  id: string,
  input: PartnerProfileInput,
  updatedBy: string,
  updaterName: string
): Promise<Partner> {
  const { data, error } = await supabase
    .from("partners")
    .update({
      name: input.name,
      mobile: input.mobile,
      email: input.email ?? null,
      organization_name: input.organization_name ?? null,
      institution: input.institution ?? null,
      facebook_link: input.facebook_link ?? null,
      linkedin_link: input.linkedin_link ?? null,
      ...(input.profile_picture_path !== undefined ? { profile_picture_path: input.profile_picture_path } : {}),
      ...(input.is_default !== undefined ? { is_default: input.is_default } : {}),
      updated_by: updatedBy,
      updater_name: updaterName,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) rethrowFriendly(error);
  return data as Partner;
}

export async function setPartnerActive(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean,
  updatedBy: string,
  updaterName: string
): Promise<Partner> {
  const { data, error } = await supabase
    .from("partners")
    .update({ is_active: isActive, updated_by: updatedBy, updater_name: updaterName })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Partner;
}

/** Hard delete — fails with a friendly error if the partner has any Projects on record (see rethrowFriendly). */
export async function deletePartner(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("partners").delete().eq("id", id);
  if (error) rethrowFriendly(error);
}
