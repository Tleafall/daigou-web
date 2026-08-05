import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "結帳" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <CheckoutForm defaultName={session.user.name ?? ""} />;
}
