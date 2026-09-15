import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPickupProfile } from "@/lib/pickup-store";
import { getStoreById, type Store711 } from "@/lib/stores-711";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "結帳" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id ?? session.user.email ?? "";
  const profile = await getPickupProfile(userId);

  // 帶回上次的取貨門市（若門市已從清單移除，用存檔的名稱/地址還原）
  const defaultStore: Store711 | null = profile
    ? getStoreById(profile.storeId) ?? {
        id: profile.storeId,
        name: profile.storeName,
        addr: profile.storeAddress,
        tel: "",
        city: "",
        town: "",
      }
    : null;

  return (
    <CheckoutForm
      defaultName={profile?.recipientName || session.user.name || ""}
      defaultPhone={profile?.recipientPhone ?? ""}
      defaultStore={defaultStore}
    />
  );
}
