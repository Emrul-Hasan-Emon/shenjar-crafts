"use client";
export default function PanelError({ reset }: { reset: () => void }) {
  return <div className="panel-empty" role="alert"><span className="panel-confirm-icon" aria-hidden="true">!</span><h2>We couldn’t load this page</h2><p>Check your connection and try again. If this continues, sign in again or contact the administrator.</p><button type="button" onClick={reset}>Try again</button></div>;
}
