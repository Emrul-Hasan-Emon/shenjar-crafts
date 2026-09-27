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
  const commission = partner.config
    ? `${partner.config.commission}${partner.config.commission_type === "percentage" ? "%" : " ৳"}`
    : "—";
  const discount = partner.config
    ? `${partner.config.discount}${partner.config.discount_type === "percentage" ? "%" : " ৳"}`
    : "—";

  return (
    <div className="partner-order-form-page">
      <div className="partner-page-header">
        <div>
          <p className="partner-eyebrow">Create order</p>
          <h1 className="font-display text-2xl font-semibold text-navy">New Order</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Add the order basics first. Customer details can stay empty if you do not have them yet.
          </p>
        </div>
        <div className="partner-rate-summary" aria-label="Partner rates applied automatically">
          <div><span>Commission</span><strong>{commission}</strong></div>
          <div><span>Customer discount</span><strong>{discount}</strong></div>
        </div>
      </div>
      <div className="mt-6 max-w-3xl">
        <CreatePartnerOrderForm
          partnerId={partner.id}
          categories={categories.map((c) => ({ id: c.id, name: c.name_en }))}
        />
      </div>
    </div>
  );
}
