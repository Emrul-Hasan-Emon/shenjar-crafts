"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Spinner from "@/components/Spinner";
import { site } from "@/data/site";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const MAX_HISTORY = 20;

export default function DesignStudioCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const history = useRef<ImageData[]>([]);
  const photoObjectUrl = useRef<string | null>(null);
  const [mode, setMode] = useState<"sketch" | "photo">("sketch");
  const [canUndo, setCanUndo] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  useEffect(() => {
    return () => {
      if (photoObjectUrl.current) URL.revokeObjectURL(photoObjectUrl.current);
    };
  }, []);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (photoObjectUrl.current) {
      URL.revokeObjectURL(photoObjectUrl.current);
      photoObjectUrl.current = null;
    }
    if (!file) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    photoObjectUrl.current = url;
    setPhotoPreviewUrl(url);
  }

  function clearPhoto() {
    if (photoObjectUrl.current) {
      URL.revokeObjectURL(photoObjectUrl.current);
      photoObjectUrl.current = null;
    }
    setPhotoPreviewUrl(null);
  }

  function pointerPos(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  function pushHistory() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    history.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (history.current.length > MAX_HISTORY) history.current.shift();
    setCanUndo(true);
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    pushHistory();
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = erasing ? 24 : 3;
    ctx.strokeStyle = erasing ? "#ffffff" : "#16294a";
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function handleUndo() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const last = history.current.pop();
    if (!canvas || !ctx || !last) return;
    ctx.putImageData(last, 0, 0);
    setCanUndo(history.current.length > 0);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvasRef.current?.getContext("2d");
    if (!canvas || !ctx) return;
    pushHistory();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Describe what you'd like to build first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResultUrl(null);
    try {
      const res = await fetch("/api/design-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setResultUrl(data.imageDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-navy">1. Show us your idea — optional</h3>
          <div className="flex shrink-0 gap-1 rounded-full bg-cream-dark p-1">
            <button
              type="button"
              onClick={() => setMode("sketch")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                mode === "sketch" ? "bg-navy text-cream" : "text-navy hover:bg-cream-dark/70"
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => setMode("photo")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                mode === "photo" ? "bg-navy text-cream" : "text-navy hover:bg-cream-dark/70"
              }`}
            >
              Upload Photo
            </button>
          </div>
        </div>

        {mode === "sketch" ? (
          <>
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="mt-4 w-full touch-none rounded-xl border-2 border-dashed border-navy/20 bg-white"
              style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setErasing(false)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  !erasing ? "bg-navy text-cream" : "bg-cream-dark text-navy hover:bg-cream-dark/70"
                }`}
              >
                Pen
              </button>
              <button
                type="button"
                onClick={() => setErasing(true)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  erasing ? "bg-navy text-cream" : "bg-cream-dark text-navy hover:bg-cream-dark/70"
                }`}
              >
                Eraser
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-navy hover:bg-cream-dark disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-navy hover:bg-cream-dark"
              >
                Clear
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <label
              htmlFor="design-studio-photo"
              className="relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-navy/20 bg-cream-dark/20 transition-colors hover:border-wood/50"
            >
              {photoPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, next/image can't optimize this
                <img src={photoPreviewUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="px-4 text-center text-sm text-ink-soft">
                  Click to choose a reference photo
                </span>
              )}
            </label>
            <input
              id="design-studio-photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="sr-only"
            />
            {photoPreviewUrl ? (
              <button
                type="button"
                onClick={clearPhoto}
                className="mt-3 text-sm font-semibold text-wood hover:underline"
              >
                Remove photo
              </button>
            ) : null}
          </div>
        )}

        <h3 className="font-display mt-6 text-lg font-semibold text-navy">2. Describe what you want</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. a walnut bedside cabinet with two drawers and brass handles"
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-wood px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wood-light disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4 border-2 text-white" /> : null}
          {busy ? "Generating..." : "Generate image"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          The image is generated from your description above using a free AI service — your{" "}
          {mode === "sketch" ? "sketch" : "photo"} stays on your device and isn&apos;t read by it
          yet. Save it and send it to us along with the AI result for the clearest picture of what
          you want. Results are AI-generated concepts to start a conversation, not exact build
          specifications.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold text-navy">Result</h3>
        <div className="mt-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-navy/20 bg-cream-dark/30">
          {busy ? (
            <Spinner className="h-10 w-10 border-[3px] text-wood" />
          ) : resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- AI-generated data URL, next/image can't optimize this
            <img src={resultUrl} alt="AI-generated concept render" className="h-full w-full object-contain" />
          ) : (
            <p className="px-4 text-center text-sm text-ink-soft">
              Your generated image will appear here.
            </p>
          )}
        </div>
        {resultUrl ? (
          <>
            <p className="mt-3 text-xs text-ink-soft">
              Long-press or right-click the image to save it, then send it to us below along with
              your {mode === "sketch" ? "sketch" : "photo"}.
            </p>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-wood px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-wood-light"
            >
              Message Us About This Design
            </a>
          </>
        ) : null}
      </div>
    </div>
  );
}
