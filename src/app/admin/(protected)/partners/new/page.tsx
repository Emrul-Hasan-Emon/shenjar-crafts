import CreatePartnerForm from "./CreatePartnerForm";

export default function NewPartnerPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">New Partner</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Name, mobile, an initial password, and either an organization or institution are required. A unique
        partner code is generated automatically.
      </p>
      <div className="mt-8 max-w-3xl">
        <CreatePartnerForm />
      </div>
    </div>
  );
}
