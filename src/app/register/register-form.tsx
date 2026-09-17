"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/lib/auth-actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    undefined,
  );

  const inputClass =
    "w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand";

  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Email *</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">姓名 *</span>
        <input
          name="name"
          required
          autoComplete="name"
          placeholder="王小明"
          className={inputClass}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">手機號碼 *</span>
        <input
          name="phone"
          required
          inputMode="numeric"
          autoComplete="tel"
          placeholder="0912345678"
          maxLength={10}
          pattern="09[0-9]{8}"
          title="手機需為 09 開頭、共 10 碼數字"
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
          }}
          className={inputClass}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">密碼 *（至少 6 碼）</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "註冊中…" : "註冊並登入"}
      </button>
    </form>
  );
}
