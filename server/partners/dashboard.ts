import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminPartnerStats = {
  totalPartners: number;
  activePartners: number;
  totalOrders: number;
  totalDeliveredOrders: number;
  totalCommission: number;
  totalDiscount: number;
};

/**
 * Reads partner_configs' cached counters rather than re-aggregating
 * finance_records — the same reasoning as the Finance dashboard
 * (finance/page.tsx), which sums a full fetch client-side rather than
 * relying on a live DB aggregate; the partner count here is small enough
 * (one row per partner) for that to stay cheap.
 */
export async function getAdminPartnerStats(supabase: SupabaseClient): Promise<AdminPartnerStats> {
  const [{ count: totalPartners }, { count: activePartners }, { data: configs, error: configsError }] =
    await Promise.all([
      supabase.from("partners").select("*", { count: "exact", head: true }),
      supabase.from("partners").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("partner_configs").select("total_orders, total_delivered_orders, total_commission, total_discount"),
    ]);
  if (configsError) throw configsError;

  const totals = (configs ?? []).reduce(
    (acc, c) => ({
      totalOrders: acc.totalOrders + c.total_orders,
      totalDeliveredOrders: acc.totalDeliveredOrders + c.total_delivered_orders,
      totalCommission: acc.totalCommission + c.total_commission,
      totalDiscount: acc.totalDiscount + c.total_discount,
    }),
    { totalOrders: 0, totalDeliveredOrders: 0, totalCommission: 0, totalDiscount: 0 }
  );

  return {
    totalPartners: totalPartners ?? 0,
    activePartners: activePartners ?? 0,
    ...totals,
  };
}
