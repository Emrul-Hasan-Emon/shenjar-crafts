import { NextResponse } from "next/server";

// Pollinations can take a while on its free tier; give it room before Vercel
// times the function out.
export const maxDuration = 60;

const STYLE_SUFFIX =
  ", photorealistic 3D product render, studio lighting, clean neutral background";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Describe what you'd like to build." }, { status: 400 });
  }

  try {
    // Pollinations' free tier only supports text-to-image right now (its
    // image-to-image "kontext" model has been moved behind a paid tier), so
    // the customer's sketch stays local — only the text prompt drives this.
    const pollinationsUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + STYLE_SUFFIX)}` +
      // seed must fit in a 32-bit int, or Pollinations rejects the request
      `?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 2147483647)}`;

    const response = await fetch(pollinationsUrl);
    if (!response.ok) {
      throw new Error(`Image generation failed (${response.status})`);
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({ imageDataUrl: `data:${contentType};base64,${base64}` });
  } catch (err) {
    console.error("design-studio generate failed:", err);
    return NextResponse.json(
      { error: "Couldn't generate an image right now — please try again in a moment." },
      { status: 502 }
    );
  }
}
