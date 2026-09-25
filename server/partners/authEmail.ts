/**
 * Partners log in with their mobile number, not an email — but Supabase
 * Auth's password sign-in needs an email or phone identifier under the
 * hood, and using real phone-based Supabase Auth would require enabling and
 * configuring an SMS provider in the Supabase project, which this app
 * doesn't have. Instead, every partner's mobile deterministically maps to
 * an internal, never-shown auth email — a pure function, safe to import
 * from both the browser (login page) and server code (auth provisioning),
 * since it's a naming convention, not a secret.
 */
export function partnerAuthEmail(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return `partner.${digits}@partners.shenjarcrafts.internal`;
}
