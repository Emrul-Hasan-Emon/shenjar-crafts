"use client";

import { notifyPanel } from "@/components/panel/PanelFeedback";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@server/supabase/client";
import { createCraftsDesign } from "@server/craft-design/designs/craftsDesigns";
import { addCraftDesignPart } from "@server/craft-design/designs/craftDesignMeasurementLabel";
import { addCraftDesignMaterial } from "@server/craft-design/designs/craftDesignMaterials";
import type { MeasurementLabel } from "@server/craft-design/measurement-labels/types";
import type { Material } from "@server/materials/types";
import Spinner from "@/components/Spinner";

/** One measurement label the admin has picked to attach to the new design, before it's
 *  actually been saved anywhere. Only the label is chosen here — the actual measurements
 *  (dimension values) are filled in afterward on the design's own detail page, since that's
 *  inherently a per-dimension task better suited to that page's fuller layout. */
type PendingPart = { measurementLabelId: string; name_en: string };

/** One material line the admin has picked, with its quantity, before the design is saved. */
type PendingMaterial = { materialId: string; name_en: string; quantity: number };

export default function CreateCraftsDesignForm({
  projects,
  availableLabels,
  materialCatalog,
}: {
  projects: { id: string; name: string }[];
  availableLabels: MeasurementLabel[];
  materialCatalog: Material[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingParts, setPendingParts] = useState<PendingPart[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState("");

  const [pendingMaterials, setPendingMaterials] = useState<PendingMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("1");

  const usedLabelIds = new Set(pendingParts.map((p) => p.measurementLabelId));
  const remainingLabels = availableLabels.filter((l) => !usedLabelIds.has(l.id));

  function handleAddPart() {
    const label = availableLabels.find((l) => l.id === selectedLabelId);
    if (!label) return;
    setPendingParts((current) => [...current, { measurementLabelId: label.id, name_en: label.name_en }]);
    setSelectedLabelId("");
  }

  function handleRemovePart(measurementLabelId: string) {
    setPendingParts((current) => current.filter((p) => p.measurementLabelId !== measurementLabelId));
  }

  function handleAddMaterial() {
    const material = materialCatalog.find((m) => m.id === selectedMaterialId);
    const quantity = Number(materialQuantity);
    if (!material || !quantity || quantity <= 0) return;
    setPendingMaterials((current) => [...current, { materialId: material.id, name_en: material.name_en, quantity }]);
    setSelectedMaterialId("");
    setMaterialQuantity("1");
  }

  function handleRemoveMaterial(materialId: string) {
    setPendingMaterials((current) => current.filter((m) => m.materialId !== materialId));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const form = new FormData(e.currentTarget);
      const nameEn = String(form.get("name_en") ?? "").trim();
      if (!nameEn) throw new Error("Name is required");
      const projectId = String(form.get("finance_record_id") ?? "");
      const supabase = createClient();

      // A part/material row needs an existing design id to attach to (a foreign-key
      // requirement), so the design itself has to be created first...
      const design = await createCraftsDesign(supabase, {
        name_en: nameEn,
        name_bn: String(form.get("name_bn") ?? "").trim() || null,
        description_en: String(form.get("description_en") ?? "").trim() || null,
        description_bn: String(form.get("description_bn") ?? "").trim() || null,
        quantity: Number(form.get("quantity") ?? 1),
        finance_record_id: projectId || null,
      });

      // ...then every picked part and material is attached to it in one go. Parts and
      // materials don't depend on each other, so they're all created concurrently.
      await Promise.all([
        ...pendingParts.map((part) => addCraftDesignPart(supabase, design.id, part.measurementLabelId)),
        ...pendingMaterials.map((material) => addCraftDesignMaterial(supabase, design.id, material.materialId, material.quantity)),
      ]);

      notifyPanel();
      router.push(`/admin/craft-designs/${design.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create design");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-navy">New Craft Design</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-navy">Name (English) *</label>
          <input name="name_en" required placeholder="e.g. Wardrobe #1" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Name (Bangla) — optional</label>
          <input name="name_bn" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Quantity</label>
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue={1}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-ink-soft">How many of this whole piece are being made.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Project — optional reference</label>
          <select name="finance_record_id" className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm">
            <option value="">— none —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-soft">For navigation only — never affects the Project&apos;s cost fields.</p>
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-navy">Description (English) — optional</label>
        <textarea name="description_en" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-navy">Description (Bangla) — optional</label>
        <textarea name="description_bn" rows={2} className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <label className="block text-sm font-medium text-navy">Measurement Labels — optional</label>
        <p className="mt-1 text-xs text-ink-soft">
          Pick which parts this design has (e.g. Side, Top). You&apos;ll enter the actual measurements after creating
          the design.
        </p>

        {pendingParts.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {pendingParts.map((part) => (
              <li
                key={part.measurementLabelId}
                className="flex items-center gap-2 rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold text-navy"
              >
                {part.name_en}
                <button
                  type="button"
                  onClick={() => handleRemovePart(part.measurementLabelId)}
                  className="text-red-600 hover:underline"
                  aria-label={`Remove ${part.name_en}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {remainingLabels.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={selectedLabelId}
              onChange={(e) => setSelectedLabelId(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">Add a measurement label...</option>
              {remainingLabels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name_en}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddPart}
              disabled={!selectedLabelId}
              className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            {availableLabels.length === 0
              ? "No Measurement Labels exist yet — create one under Measurement Labels first."
              : "Every available measurement label has been added."}
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <label className="block text-sm font-medium text-navy">Materials — optional</label>
        <p className="mt-1 text-xs text-ink-soft">Hardware/supplies this design uses (screws, hinges, glue, ...).</p>

        {pendingMaterials.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {pendingMaterials.map((material) => (
              <li
                key={material.materialId}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  {material.name_en} <span className="text-ink-soft">× {material.quantity}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(material.materialId)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {materialCatalog.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">Add a material...</option>
              {materialCatalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name_en}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              step="any"
              value={materialQuantity}
              onChange={(e) => setMaterialQuantity(e.target.value)}
              className="w-20 rounded-lg border border-border px-2 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleAddMaterial}
              disabled={!selectedMaterialId}
              className="inline-flex items-center gap-2 rounded-full bg-wood px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No materials in the catalog yet — add one under Materials.</p>
        )}
      </div>

      {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-wood px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
      >
        {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
        {busy ? "Creating..." : "Create design"}
      </button>
    </form>
  );
}
