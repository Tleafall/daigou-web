import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listAddresses } from "@/lib/address-store";
import {
  addAddressAction,
  removeAddressAction,
  setDefaultAddressAction,
} from "@/lib/address-actions";

export const metadata: Metadata = { title: "常用收件地址" };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await listAddresses(user.id ?? user.email ?? "");

  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-ink/50">
        <Link href="/account" className="hover:text-brand">會員中心</Link>
        <span className="mx-2">/</span>
        <span className="text-ink/80">常用收件地址</span>
      </nav>
      <h1 className="mb-6 text-xl font-bold">常用收件地址</h1>

      {/* 現有地址 */}
      <div className="flex flex-col gap-3">
        {addresses.length === 0 && (
          <p className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-ink/50">
            尚未新增地址
          </p>
        )}
        {addresses.map((a) => (
          <div key={a.id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{a.recipientName}</span>
                <span className="ml-2 text-ink/60">{a.recipientPhone}</span>
                {a.isDefault && (
                  <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand">
                    預設
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!a.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-ink/50 hover:text-brand">設為預設</button>
                  </form>
                )}
                <form action={removeAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-xs text-ink/50 hover:text-red-500">刪除</button>
                </form>
              </div>
            </div>
            <div className="mt-1 text-sm text-ink/70">
              {a.city}{a.district}{a.addressLine}
            </div>
          </div>
        ))}
      </div>

      {/* 新增地址 */}
      <form action={addAddressAction} className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-white p-5">
        <h2 className="font-bold">新增地址</h2>
        <div className="grid grid-cols-2 gap-3">
          <input name="recipientName" required placeholder="收件人姓名" className={inputClass} />
          <input name="recipientPhone" required placeholder="手機 0912345678" inputMode="numeric" className={inputClass} />
          <input name="city" required placeholder="縣市" className={inputClass} />
          <input name="district" required placeholder="鄉鎮市區" className={inputClass} />
        </div>
        <input name="addressLine" required placeholder="詳細地址" className={inputClass} />
        <button className="self-start rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
          新增
        </button>
      </form>
    </div>
  );
}
