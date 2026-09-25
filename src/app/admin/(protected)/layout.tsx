import type { ReactNode } from "react";
import { createClient } from "@server/supabase/server-client";
import { signOutAction } from "./actions";
import PanelShell from "@/components/panel/PanelShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PanelShell mode="Admin" identity={user?.email ?? "Administrator"} signOutAction={signOutAction} groups={[
    { label: "Overview", items: [{ href: "/admin", label: "Dashboard" }] },
    { label: "Business", items: [{ href: "/admin/finance", label: "Finance" }, { href: "/admin/partners", label: "Partners" }] },
    { label: "Workshop", items: [{ href: "/admin/craft-designs", label: "Craft designs" }, { href: "/admin/boards", label: "Boards" }, { href: "/admin/materials", label: "Materials" }, { href: "/admin/measurement-labels", label: "Measurements" }] },
    { label: "Website content", items: [{ href: "/admin/categories", label: "Categories" }, { href: "/admin/banners", label: "Banners" }, { href: "/admin/photocards", label: "Photocards" }, { href: "/admin/raw-media", label: "Project media" }, { href: "/admin/about-us", label: "About us" }] },
  ]}>{children}</PanelShell>;
}
