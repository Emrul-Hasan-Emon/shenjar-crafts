"use client";

import { useEffect, useRef, useState } from "react";

type Notice = { message: string; tone: "success" | "error" };
type Confirmation = { message: string; resolve: (value: boolean) => void };
export function notifyPanel(message = "Changes saved successfully.", tone: Notice["tone"] = "success") {
  window.dispatchEvent(new CustomEvent("panel-notice", { detail: { message, tone } }));
}
export function confirmPanel(message: string): Promise<boolean> {
  return new Promise(resolve => window.dispatchEvent(new CustomEvent("panel-confirm", { detail: { message, resolve } })));
}
export default function PanelFeedback() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const pending = useRef<Confirmation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const onNotice = (event: Event) => setNotice((event as CustomEvent<Notice>).detail);
    const onConfirm = (event: Event) => {
      pending.current?.resolve(false);
      pending.current = (event as CustomEvent<Confirmation>).detail;
      setConfirmation(pending.current);
    };
    window.addEventListener("panel-notice", onNotice);
    window.addEventListener("panel-confirm", onConfirm);
    return () => { window.removeEventListener("panel-notice", onNotice); window.removeEventListener("panel-confirm", onConfirm); pending.current?.resolve(false); };
  }, []);
  useEffect(() => { if (confirmation) dialog.current?.showModal(); }, [confirmation]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), notice.tone === "error" ? 10000 : 5000); return () => clearTimeout(timer); }, [notice]);
  function finish(approved: boolean) { pending.current?.resolve(approved); pending.current = null; dialog.current?.close(); setConfirmation(null); }
  return <>
    <div className="panel-toast-region" aria-live="polite" aria-atomic="true">{notice ? <div className={`panel-toast ${notice.tone}`}><span aria-hidden="true">{notice.tone === "success" ? "✓" : "!"}</span><p>{notice.message}</p><button aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button></div> : null}</div>
    <dialog ref={dialog} className="panel-theme panel-confirm" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" onCancel={() => finish(false)}>
      <div className="panel-confirm-icon" aria-hidden="true">!</div><h2 id="confirmation-title">Confirm this action</h2><p id="confirmation-description">{confirmation?.message}</p>
      <div className="panel-confirm-actions"><button type="button" autoFocus onClick={() => finish(false)}>Cancel</button><button type="button" className="panel-danger" onClick={() => finish(true)}>Confirm</button></div>
    </dialog>
  </>;
}
