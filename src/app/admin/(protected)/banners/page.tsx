import { createClient } from "@server/supabase/server-client";
import { listBanners, MAX_BANNERS } from "@server/db/banners";
import { getPublicUrl } from "@server/supabase/storage";
import BannersManager from "./BannersManager";

export default async function AdminBannersPage() {
  const supabase = await createClient();
  const banners = await listBanners(supabase);
  const items = banners.map((b) => ({ id: b.id, url: getPublicUrl(supabase, b.image_path) }));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy">Banners</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Up to {MAX_BANNERS} images shown as the homepage slider, left to right.
      </p>
      <div className="mt-8">
        <BannersManager initialBanners={items} maxBanners={MAX_BANNERS} />
      </div>
    </div>
  );
}
