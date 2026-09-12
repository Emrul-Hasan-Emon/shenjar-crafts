import { createClient } from "@server/supabase/server-client";
import { getAboutUs } from "@server/db/aboutUs";
import AboutUsForm from "./AboutUsForm";

export default async function AdminAboutUsPage() {
  const supabase = await createClient();
  const aboutUs = await getAboutUs(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">About Us</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Shown on the public About page. Leave blank to use the site&apos;s default text.
      </p>
      <div className="mt-8 max-w-2xl">
        <AboutUsForm initial={aboutUs} />
      </div>
    </div>
  );
}
