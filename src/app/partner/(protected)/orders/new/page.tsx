import { redirect } from "next/navigation";
import { createClient } from "@server/supabase/server-client";
import { getPartnerByUserId } from "@server/partners/partners";
import { listCategories } from "@server/db/categories";
import CreatePartnerOrderForm from "./CreatePartnerOrderForm";

export default async function NewPartnerOrderPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/partner/login");
  const partner = await getPartnerByUserId(supabase, user.id);
  if (!partner) redirect("/partner/login");

  const categories = await listCategories(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">New Order</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Your commission ({partner.config?.commission}
        {partner.config?.commission_type === "percentage" ? "%" : " ৳"}) and the customer&apos;s discount (
        {partner.config?.discount}
        {partner.config?.discount_type === "percentage" ? "%" : " ৳"}) apply automatically. Commission is
        earned once the order is delivered.
      </p>
      <div className="mt-8 max-w-3xl">
        <CreatePartnerOrderForm
          partnerId={partner.id}
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
        />
      </div>
    </div>
  );
}
