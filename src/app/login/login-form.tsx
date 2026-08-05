"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/auth-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="admin@test.com"
          className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ink/70">密碼</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
