import type { ReactNode } from "react";
import { createClient } from "@server/supabase/server-client";
import { signOutAction } from "./actions";
import AdminNav from "./_components/AdminNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-cream-dark/30 print:bg-white">
      <AdminNav userEmail={user?.email ?? null} signOutAction={signOutAction} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
