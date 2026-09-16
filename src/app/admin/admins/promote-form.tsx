"use client";

import { useActionState } from "react";
import { promoteAdminAction, type PromoteState } from "@/lib/admin-user-actions";

export function PromoteForm() {
  const [state, action, pending] = useActionState<PromoteState, FormData>(
    promoteAdminAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          已把 {state.email} 設為管理員。
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-ink/70">會員 Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="要授權的人的 Email（需先註冊過）"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "設定中…" : "設為管理員"}
        </button>
      </div>
    </form>
  );
}
