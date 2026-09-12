"use client";

export default function InvoiceActions({
  publicUrl,
  customerMobile,
  projectName,
}: {
  publicUrl: string;
  customerMobile: string | null;
  projectName: string;
}) {
  const message = `Hi! Here is your invoice for "${projectName}" from Shenjar Crafts: ${publicUrl}`;
  const digitsOnly = customerMobile ? customerMobile.replace(/\D/g, "") : "";
  const whatsappHref = `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;

  return (
    <div className="mt-6 max-w-2xl">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light"
        >
          Print / Save as PDF
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          Send via WhatsApp
        </a>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Shareable link (no login required to view): <span className="font-medium text-navy">{publicUrl}</span>
      </p>
    </div>
  );
}
