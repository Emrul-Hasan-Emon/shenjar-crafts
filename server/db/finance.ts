import type { SupabaseClient } from "@supabase/supabase-js";

export type FinanceType = "project" | "spend";
export type ProjectStatus = "pending" | "started" | "finished" | "delivered";
export type CustomerGender = "male" | "female" | "other";

export type FinanceRecord = {
  id: string;
  type: FinanceType;
  category: string;
  name: string;
  price: number;
  description: string | null;
  quantity: number | null;
  estimated_start_time: string | null;
  estimated_delivery_time: string | null;
  material_cost: number | null;
  making_cost: number | null;
  customer_name: string | null;
  customer_gender: CustomerGender | null;
  customer_mobile: string | null;
  customer_email: string | null;
  customer_address: string | null;
  status: ProjectStatus | null;
  // Computed by Postgres (generated columns) — never set these from the app.
  total_price: number;
  total_cost_per_quantity: number | null;
  total_cost_all: number | null;
  // Partner association — see docs/partner-management-plan.md. partner_id is
  // the only field the app ever sets directly; the commission/discount
  // snapshot and amount columns are all populated/computed by Postgres.
  partner_id: string | null;
  partner_code: string | null;
  commission_rate: number | null;
  commission_type: "fixed" | "percentage" | null;
  commission_amount: number;
  discount_rate: number | null;
  discount_type: "fixed" | "percentage" | null;
  discount_amount: number;
  total_amount: number;
  commission_status: "pending" | "earned" | "unearned";
  created_at: string;
  updated_at: string;
};

export type FinanceRecordInput = {
  type: FinanceType;
  category: string;
  name: string;
  price: number;
  description?: string | null;
  quantity?: number | null;
  estimated_start_time?: string | null;
  estimated_delivery_time?: string | null;
  material_cost?: number | null;
  making_cost?: number | null;
  customer_name?: string | null;
  customer_gender?: CustomerGender | null;
  customer_mobile?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  status?: ProjectStatus | null;
  /** Set when Admin creates this Project on behalf of a partner. Never set
   * from the partner's own create-order form — that path goes through
   * server/partners/orders.ts, which resolves partner_id from the session. */
  partner_id?: string | null;
};

function toRow(input: Partial<FinanceRecordInput>) {
  // Deliberately excludes total_price/total_cost_* — those are Postgres
  // generated columns; sending them would be rejected (or, worse if the
  // table were ever changed to allow it, would make the client the source
  // of truth for money math, which is exactly what we don't want).
  return { ...input };
}

export async function listFinanceRecords(
  supabase: SupabaseClient,
  opts?: { type?: FinanceType }
): Promise<FinanceRecord[]> {
  let query = supabase.from("finance_records").select("*").order("created_at", { ascending: false });
  if (opts?.type) query = query.eq("type", opts.type);
  const { data, error } = await query;
  if (error) throw error;
  return data as FinanceRecord[];
}

export async function getFinanceRecordById(
  supabase: SupabaseClient,
  id: string
): Promise<FinanceRecord | null> {
  const { data, error } = await supabase.from("finance_records").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as FinanceRecord | null;
}

export async function createFinanceRecord(
  supabase: SupabaseClient,
  input: FinanceRecordInput
): Promise<FinanceRecord> {
  const { data, error } = await supabase
    .from("finance_records")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return data as FinanceRecord;
}

export async function updateFinanceRecord(
  supabase: SupabaseClient,
  id: string,
  input: Partial<FinanceRecordInput>
): Promise<FinanceRecord> {
  const { data, error } = await supabase
    .from("finance_records")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as FinanceRecord;
}

export async function deleteFinanceRecord(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("finance_records").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Customer-facing invoice fields only — deliberately excludes material_cost,
 * making_cost, total_cost_per_quantity, and total_cost_all. Callable by
 * anyone (even signed out) via the public invoice page, since it goes
 * through the get_public_invoice() Postgres function rather than a direct
 * table read — finance_records itself stays authenticated-only. The
 * function only ever returns this fixed column list for one project id, so
 * no other row or field is ever exposed.
 */
export type PublicInvoice = {
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
  customer_gender: CustomerGender | null;
  customer_mobile: string | null;
  customer_email: string | null;
  customer_address: string | null;
  status: ProjectStatus | null;
  created_at: string;
};

export async function getPublicInvoice(
  supabase: SupabaseClient,
  id: string
): Promise<PublicInvoice | null> {
  const { data, error } = await supabase.rpc("get_public_invoice", { p_id: id });
  if (error) throw error;
  const rows = data as PublicInvoice[] | null;
  return rows && rows.length > 0 ? rows[0] : null;
}
