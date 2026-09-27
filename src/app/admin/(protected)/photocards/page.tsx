import { redirect } from "next/navigation";

export default async function AdminPhotocardsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  redirect(category ? `/admin/products?category=${category}` : "/admin/products");
}
