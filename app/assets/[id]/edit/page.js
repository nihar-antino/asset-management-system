import EditAssetForm from "@/components/EditAssetForm";
import { getAsset } from "@/lib/assets";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditAssetPage({ params }) {
  const { id } = await params;
  const asset = await getAsset(id);
  if (!asset) notFound();

  return <EditAssetForm asset={asset} />;
}
