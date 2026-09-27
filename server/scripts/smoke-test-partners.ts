/**
 * Smoke test for the Partner Management feature: creates a handful of random
 * partners against a real Supabase project (via the service role key) and
 * exercises the create -> order -> deliver flow, asserting the schema's
 * generated columns and triggers behave as documented in
 * docs/partner-management-plan.md.
 *
 * Run locally (never in CI/Vercel): npx tsx server/scripts/smoke-test-partners.ts
 * Only ever runs against the "development" Supabase project — refuses to run at all if
 * NODE_ENV=production (see README.md, "Two Supabase environments").
 *
 * Leaves the created partners/orders in the database on purpose, so they're
 * visible in /admin/partners afterwards — this is not a cleanup script.
 */
import { createClient } from "@supabase/supabase-js";
import { partnerAuthEmail } from "../partners/authEmail";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../supabase/env";
import { loadSupabaseEnv, assertNotProduction } from "./loadSupabaseEnv";

loadSupabaseEnv();
assertNotProduction("smoke-test-partners.ts");

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return code;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = randomCode();
    const { data } = await supabase.from("partner_configs").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Could not generate a unique code");
}

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`, detail ?? "");
  }
}

const PARTNER_SEEDS = [
  {
    name: "Rahim Uddin",
    mobile: "01711000001",
    organization_name: "Uddin Traders",
    institution: null as string | null,
    commission: 500,
    commission_type: "fixed" as const,
    discount: 5,
    discount_type: "percentage" as const,
  },
  {
    name: "Farhana Akter",
    mobile: "01711000002",
    organization_name: null as string | null,
    institution: "Dhaka Polytechnic Institute",
    commission: 10,
    commission_type: "percentage" as const,
    discount: 300,
    discount_type: "fixed" as const,
  },
  {
    name: "Kamal Hossain",
    mobile: "01711000003",
    organization_name: "Hossain & Sons",
    institution: null as string | null,
    commission: 8,
    commission_type: "percentage" as const,
    discount: 8,
    discount_type: "percentage" as const,
  },
];

async function createTestPartner(seed: (typeof PARTNER_SEEDS)[number], suffix: string) {
  // mobile is unique (partners_mobile_idx), so re-running the script needs a
  // fresh mobile each time too, not just a fresh email. suffix is base36
  // (from Date.now()), so derive a numeric tail straight from the clock
  // instead of trying to extract digits out of it.
  const mobile = `${seed.mobile}${String(Date.now()).slice(-4)}`;
  const email = `smoketest.${seed.name.toLowerCase().replace(/\s+/g, ".")}.${suffix}@shenjarcrafts.test`;
  const password = `Smoke-Test-${suffix}-Pw1!`;

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: partnerAuthEmail(mobile),
    password,
    email_confirm: true,
  });
  if (authError) throw new Error(`auth.admin.createUser(${mobile}): ${authError.message}`);

  const code = await uniqueCode();

  const { data: partner, error: partnerError } = await supabase.rpc("create_partner", {
    p_user_id: authUser.user.id,
    p_code: code,
    p_name: seed.name,
    p_mobile: mobile,
    p_email: email,
    p_organization_name: seed.organization_name,
    p_institution: seed.institution,
    p_facebook_link: null,
    p_linkedin_link: null,
    p_profile_picture_path: null,
    p_is_active: true,
    p_is_default: true,
    p_commission: seed.commission,
    p_commission_type: seed.commission_type,
    p_discount: seed.discount,
    p_discount_type: seed.discount_type,
    p_created_by: authUser.user.id,
    p_creator_name: "smoke-test script",
  });
  if (partnerError) throw new Error(`create_partner(${seed.name}): ${partnerError.message}`);

  return { partner, code, email };
}

async function main() {
  const suffix = Date.now().toString(36);
  console.log(`Creating ${PARTNER_SEEDS.length} random partners (suffix ${suffix})...\n`);

  const created: Array<{ partner: { id: string; name: string }; code: string; email: string }> = [];
  for (const seed of PARTNER_SEEDS) {
    const result = await createTestPartner(seed, suffix);
    created.push(result);
    console.log(`Created "${result.partner.name}" — code ${result.code} (${result.email})`);
  }

  console.log("\nSchema checks:");
  for (const { partner, code } of created) {
    check(`${partner.name}: code is 6 characters`, code.length === 6, code);
    const { data: config } = await supabase.from("partner_configs").select("*").eq("partner_id", partner.id).single();
    check(`${partner.name}: partner_configs row exists`, !!config);
    check(`${partner.name}: starts with zeroed counters`, config?.total_orders === 0 && config?.total_commission === 0);
  }

  // Exercise the order -> delivery flow on the first partner.
  const [{ partner: testPartner }] = created;
  console.log(`\nCreating a test Project for "${testPartner.name}"...`);

  const { data: order, error: orderError } = await supabase
    .from("finance_records")
    .insert({
      type: "project",
      category: "Smoke Test",
      name: `Smoke test order ${suffix}`,
      price: 1000,
      quantity: 10, // total_price (before discount) = 10,000
      partner_id: testPartner.id,
      customer_name: "Test Customer",
    })
    .select("*")
    .single();
  if (orderError) throw new Error(`insert finance_records: ${orderError.message}`);

  console.log("Order created:", {
    total_price: order.total_price,
    partner_code: order.partner_code,
    commission_rate: order.commission_rate,
    commission_type: order.commission_type,
    commission_amount: order.commission_amount,
    discount_rate: order.discount_rate,
    discount_type: order.discount_type,
    discount_amount: order.discount_amount,
    total_amount: order.total_amount,
    commission_status: order.commission_status,
  });

  const seed = PARTNER_SEEDS[0];
  const expectedDiscountAmount =
    seed.discount_type === "fixed" ? seed.discount : (order.total_price * seed.discount) / 100;
  const expectedCommissionAmount =
    seed.commission_type === "fixed" ? seed.commission : (order.total_price * seed.commission) / 100;

  console.log("\nOrder creation checks:");
  check("total_price = price * quantity", order.total_price === 10000, order.total_price);
  check("partner_code snapshot matches", order.partner_code === created[0].code, order.partner_code);
  check("commission_status starts pending", order.commission_status === "pending", order.commission_status);
  check(
    "discount_amount computed correctly",
    Math.abs(order.discount_amount - expectedDiscountAmount) < 0.01,
    { got: order.discount_amount, expected: expectedDiscountAmount }
  );
  check(
    "commission_amount computed correctly",
    Math.abs(order.commission_amount - expectedCommissionAmount) < 0.01,
    { got: order.commission_amount, expected: expectedCommissionAmount }
  );
  check(
    "total_amount = total_price - discount_amount",
    Math.abs(order.total_amount - (order.total_price - order.discount_amount)) < 0.01,
    order.total_amount
  );

  const { data: configAfterCreate } = await supabase
    .from("partner_configs")
    .select("*")
    .eq("partner_id", testPartner.id)
    .single();
  check("total_orders incremented at creation", configAfterCreate?.total_orders === 1, configAfterCreate?.total_orders);
  check(
    "total_commission NOT incremented before delivery",
    configAfterCreate?.total_commission === 0,
    configAfterCreate?.total_commission
  );
  check(
    "total_discount NOT incremented before delivery",
    configAfterCreate?.total_discount === 0,
    configAfterCreate?.total_discount
  );

  console.log("\nMarking the order as delivered...");
  const { data: deliveredOrder, error: deliverError } = await supabase
    .from("finance_records")
    .update({ status: "delivered" })
    .eq("id", order.id)
    .select("*")
    .single();
  if (deliverError) throw new Error(`update status=delivered: ${deliverError.message}`);

  check("commission_status flips to earned", deliveredOrder.commission_status === "earned", deliveredOrder.commission_status);

  const { data: configAfterDeliver } = await supabase
    .from("partner_configs")
    .select("*")
    .eq("partner_id", testPartner.id)
    .single();
  check(
    "total_delivered_orders incremented on delivery",
    configAfterDeliver?.total_delivered_orders === 1,
    configAfterDeliver?.total_delivered_orders
  );
  check(
    "total_commission incremented on delivery",
    Math.abs(configAfterDeliver.total_commission - expectedCommissionAmount) < 0.01,
    configAfterDeliver?.total_commission
  );
  check(
    "total_discount incremented on delivery",
    Math.abs(configAfterDeliver.total_discount - expectedDiscountAmount) < 0.01,
    configAfterDeliver?.total_discount
  );

  console.log("\nReverting the order back to pending (tests the reversal path)...");
  await supabase.from("finance_records").update({ status: "pending" }).eq("id", order.id);
  const { data: configAfterRevert } = await supabase
    .from("partner_configs")
    .select("*")
    .eq("partner_id", testPartner.id)
    .single();
  check(
    "total_commission reversed after un-delivering",
    configAfterRevert?.total_commission === 0,
    configAfterRevert?.total_commission
  );
  check(
    "total_delivered_orders reversed after un-delivering",
    configAfterRevert?.total_delivered_orders === 0,
    configAfterRevert?.total_delivered_orders
  );

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
