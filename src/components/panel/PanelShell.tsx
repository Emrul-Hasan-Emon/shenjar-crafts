"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import PanelFeedback from "./PanelFeedback";

export type PanelNavGroup = { label: string; items: { href: string; label: string }[] };
export default function PanelShell({ children, mode, identity, subtitle, groups, signOutAction }: {
  children: ReactNode; mode: "Admin" | "Partner"; identity: string; subtitle?: string;
  groups: PanelNavGroup[]; signOutAction: () => void;
}) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const root = mode === "Admin" ? "/admin" : "/partner";
  const items = groups.flatMap(group => group.items);
  const active = (href: string) => href === root ? pathname === root : pathname.startsWith(href);
  const current = [...items].reverse().find(item => active(item.href))?.label ?? mode;
  useEffect(() => { dialog.current?.close(); }, [pathname]);
  function openDrawer() { dialog.current?.showModal(); setDrawerOpen(true); }
  function closeDrawer() { dialog.current?.close(); setDrawerOpen(false); }
  function navigation(mobile = false) {
    return <>
      <Link href={root} className="panel-brand" onClick={closeDrawer}><span className="panel-brand-mark">S</span><span>Shenjar Crafts<small>{mode} workspace</small></span></Link>
      <nav aria-label={`${mode} navigation`} className="panel-nav">
        {groups.map((group, index) => <div key={group.label} className="panel-nav-group"><p>{group.label}</p>{group.items.map(item => <Link key={item.href} href={item.href} onClick={() => dialog.current?.close()} aria-current={active(item.href) ? "page" : undefined}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={index % 3 === 0 ? "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" : index % 3 === 1 ? "M4 5h16v14H4zM4 10h16M10 10v9" : "M12 3l9 5-9 5-9-5 9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"} /></svg>
          {item.label}<span className="panel-nav-indicator" aria-hidden="true">›</span>
        </Link>)}</div>)}
      </nav>
      <div className="panel-account"><span className="panel-avatar">{identity.slice(0, 1).toUpperCase()}</span><div><strong title={identity}>{identity}</strong><small>{subtitle ?? `${mode} access`}</small></div></div>
      <div className="panel-sidebar-actions"><Link href="/">View website ↗</Link><form action={signOutAction}><button type="submit">Sign out</button></form></div>
      {mobile ? <button className="panel-menu-close" type="button" onClick={closeDrawer}>Close navigation</button> : null}
    </>;
  }
  return <div className="panel-theme panel-shell">
    <a href="#panel-main" className="panel-skip">Skip to workspace</a>
    <aside className="panel-sidebar print:hidden">{navigation()}</aside>
    <dialog ref={dialog} className="panel-theme panel-drawer" aria-label={`${mode} navigation`} onClose={() => setDrawerOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeDrawer(); }}>
      <div className="panel-drawer-inner">{navigation(true)}</div>
    </dialog>
    <div className="panel-workspace">
      <header className="panel-topbar print:hidden"><div className="flex min-w-0 items-center gap-3"><button type="button" className="panel-menu-trigger" aria-label="Open navigation" aria-expanded={drawerOpen} onClick={openDrawer}><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button><div className="panel-breadcrumb"><span>{mode} workspace</span><span aria-hidden="true">/</span><strong>{current}</strong></div></div><span className="panel-access-badge">{mode}</span></header>
      <main id="panel-main" tabIndex={-1} className="panel-main"><div className="panel-content">{children}</div></main>
    </div>
    <PanelFeedback />
  </div>;
}
