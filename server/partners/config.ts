import type { SupabaseClient } from "@supabase/supabase-js";
import type { PartnerCommissionDiscountInput, PartnerConfig } from "./types";

export async function getPartnerConfig(
  supabase: SupabaseClient,
  partnerId: string
): Promise<PartnerConfig | null> {
  const { data, error } = await supabase
    .from("partner_configs")
    .select("*")
    .eq("partner_id", partnerId)
    .maybeSingle();
  if (error) throw error;
  return data as PartnerConfig | null;
}

/**
 * Updates only the commission/discount rate — never total_orders/
 * total_delivered_orders/total_commission/total_discount, which are cached
 * counters the finance_records triggers own exclusively.
 */
export async function updatePartnerConfig(
  supabase: SupabaseClient,
  partnerId: string,
  input: PartnerCommissionDiscountInput,
  updatedBy: string,
  updaterName: string
): Promise<PartnerConfig> {
  const { data, error } = await supabase
    .from("partner_configs")
    .update({
      commission: input.commission,
      commission_type: input.commission_type,
      discount: input.discount,
      discount_type: input.discount_type,
      updated_by: updatedBy,
      updater_name: updaterName,
    })
    .eq("partner_id", partnerId)
    .select("*")
    .single();
  if (error) throw error;
  return data as PartnerConfig;
}
