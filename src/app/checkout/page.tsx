import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDefaultAddress } from "@/lib/address-store";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "結帳" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const addr = getDefaultAddress(session.user.id ?? session.user.email ?? "");

  return (
    <CheckoutForm
      defaultName={session.user.name ?? ""}
      defaultAddress={
        addr
          ? {
              recipientName: addr.recipientName,
              recipientPhone: addr.recipientPhone,
              city: addr.city,
              district: addr.district,
              addressLine: addr.addressLine,
            }
          : null
      }
    />
  );
}
