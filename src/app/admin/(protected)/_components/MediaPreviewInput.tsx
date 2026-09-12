"use client";

import { useEffect, useRef, useState } from "react";

export default function MediaPreviewInput({
  name,
  accept,
  required,
  busy,
  existingUrl,
  existingIsVideo,
  onFileChange,
}: {
  name: string;
  accept: string;
  required?: boolean;
  busy?: boolean;
  /** Shown before any new file is picked — e.g. the item's current image when editing. */
  existingUrl?: string | null;
  existingIsVideo?: boolean;
  onFileChange?: (file: File | null) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const inputId = `media-input-${name}`;

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!file) {
      setPreviewUrl(null);
      onFileChange?.(null);
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setIsVideo(file.type.startsWith("video/"));
    setPreviewUrl(url);
    onFileChange?.(file);
  }

  const showUrl = previewUrl ?? existingUrl ?? null;
  const showIsVideo = previewUrl ? isVideo : !!existingIsVideo;

  return (
    <div>
      <input
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        required={required}
        onChange={handleChange}
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className="relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-navy/20 bg-cream-dark/30 transition-colors hover:border-wood/50"
      >
        {showUrl ? (
          showIsVideo ? (
            <video src={showUrl} className="h-full w-full object-cover" muted preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- local blob/object URL preview, next/image can't optimize this
            <img src={showUrl} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="px-4 text-center text-sm text-ink-soft">Click to choose an image or video</span>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-dark/50">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
          </div>
        ) : null}
      </label>
    </div>
  );
}
