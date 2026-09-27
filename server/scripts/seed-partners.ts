/**
 * Creates a handful of real (non-throwaway) partner accounts for local
 * testing, each with the password "123456" — a deliberately simple password
 * for dev-environment testing only, not meant for production use.
 *
 * Run locally (never in CI/Vercel): npx tsx server/scripts/seed-partners.ts
 * Only ever runs against the "development" Supabase project — refuses to run at all if
 * NODE_ENV=production (see README.md, "Two Supabase environments").
 */
import { createClient } from "@supabase/supabase-js";
import { partnerAuthEmail } from "../partners/authEmail";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from "../supabase/env";
import { loadSupabaseEnv, assertNotProduction } from "./loadSupabaseEnv";

loadSupabaseEnv();
assertNotProduction("seed-partners.ts");

const supabase = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey());

const PASSWORD = "123456";
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

const PARTNERS = [
  {
    name: "Rahim Uddin",
    mobile: "01711000101",
    email: "rahim.uddin@shenjarcrafts.test",
    organization_name: "Uddin Traders",
    institution: null as string | null,
    commission: 500,
    commission_type: "fixed" as const,
    discount: 5,
    discount_type: "percentage" as const,
  },
  {
    name: "Farhana Akter",
    mobile: "01711000102",
    email: "farhana.akter@shenjarcrafts.test",
    organization_name: null as string | null,
    institution: "Dhaka Polytechnic Institute",
    commission: 10,
    commission_type: "percentage" as const,
    discount: 300,
    discount_type: "fixed" as const,
  },
  {
    name: "Kamal Hossain",
    mobile: "01711000103",
    email: "kamal.hossain@shenjarcrafts.test",
    organization_name: "Hossain & Sons Interiors",
    institution: null as string | null,
    commission: 8,
    commission_type: "percentage" as const,
    discount: 8,
    discount_type: "percentage" as const,
  },
];

async function main() {
  console.log(`Creating ${PARTNERS.length} partners, password "${PASSWORD}" for all...\n`);
  const created: Array<{ name: string; mobile: string; code: string }> = [];

  for (const p of PARTNERS) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: partnerAuthEmail(p.mobile),
      password: PASSWORD,
      email_confirm: true,
    });
    if (authError) {
      console.error(`Skipping ${p.name} (${p.mobile}): ${authError.message}`);
      continue;
    }

    const code = await uniqueCode();
    const { data: partner, error: partnerError } = await supabase.rpc("create_partner", {
      p_user_id: authUser.user.id,
      p_code: code,
      p_name: p.name,
      p_mobile: p.mobile,
      p_email: p.email,
      p_organization_name: p.organization_name,
      p_institution: p.institution,
      p_facebook_link: null,
      p_linkedin_link: null,
      p_profile_picture_path: null,
      p_is_active: true,
      p_is_default: true,
      p_commission: p.commission,
      p_commission_type: p.commission_type,
      p_discount: p.discount,
      p_discount_type: p.discount_type,
      p_created_by: authUser.user.id,
      p_creator_name: "seed-partners script",
    });
    if (partnerError) {
      console.error(`Failed to create partners row for ${p.name}: ${partnerError.message}`);
      continue;
    }

    created.push({ name: partner.name, mobile: p.mobile, code });
    console.log(`Created "${p.name}" — code ${code}`);
  }

  console.log("\nLogin credentials (password is the same for all: " + PASSWORD + "):");
  console.table(created);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
