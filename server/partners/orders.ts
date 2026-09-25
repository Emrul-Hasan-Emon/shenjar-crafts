import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerGender, FinanceRecord } from "@server/db/finance";

/**
 * The columns a partner is allowed to see for their own orders — mirrors
 * get_public_invoice's exclusion of material_cost/making_cost/
 * total_cost_per_quantity/total_cost_all (see docs/partner-management-plan.md,
 * "Authorization model"). Even though today's partner pages render this
 * server-side with no client-component boundary that would serialize the
 * extra fields to the browser, this keeps that guarantee explicit rather
 * than resting on Next.js internals.
 */
const PARTNER_ORDER_COLUMNS =
  "id, type, category, name, price, description, quantity, estimated_start_time, estimated_delivery_time, " +
  "customer_name, customer_gender, customer_mobile, customer_email, customer_address, status, total_price, " +
  "partner_id, partner_code, commission_rate, commission_type, commission_amount, discount_rate, discount_type, " +
  "discount_amount, total_amount, commission_status, created_at, updated_at";

export type PartnerVisibleFinanceRecord = Omit<
  FinanceRecord,
  "material_cost" | "making_cost" | "total_cost_per_quantity" | "total_cost_all"
>;

export type CreatePartnerOrderInput = {
  category: string;
  name: string;
  price: number;
  quantity?: number | null;
  description?: string | null;
  estimated_start_time?: string | null;
  estimated_delivery_time?: string | null;
  customer_name?: string | null;
  customer_gender?: CustomerGender | null;
  customer_mobile?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
};

/**
 * A partner creating their own order. partner_id is passed in explicitly
 * (the caller resolves it from the logged-in partner's own row), but the
 * RLS insert policy ("partner insert own finance_records") is what actually
 * enforces it can only ever be their own id — this parameter is not itself
 * a trust boundary. status is always left unset: the "partner insert own"
 * policy requires status is null, so a partner can never self-declare
 * their own order delivered.
 */
export async function createPartnerOrder(
  supabase: SupabaseClient,
  partnerId: string,
  input: CreatePartnerOrderInput
): Promise<PartnerVisibleFinanceRecord> {
  const { data, error } = await supabase
    .from("finance_records")
    .insert({ type: "project", partner_id: partnerId, ...input })
    .select(PARTNER_ORDER_COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as PartnerVisibleFinanceRecord;
}

export async function listPartnerOrders(
  supabase: SupabaseClient,
  partnerId: string,
  opts: { page?: number; pageSize?: number } = {}
): Promise<{ data: PartnerVisibleFinanceRecord[]; count: number }> {
  const page = opts.page ?? 1;
  const pageSize = opts.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("finance_records")
    .select(PARTNER_ORDER_COLUMNS, { count: "exact" })
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { data: data as unknown as PartnerVisibleFinanceRecord[], count: count ?? 0 };
}
