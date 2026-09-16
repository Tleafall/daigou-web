"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { createCustomer, findUserByEmail } from "@/lib/user-store";
import { hashPassword } from "@/lib/password";
import { testUsers } from "@/lib/test-users";

export type LoginState = { error?: string } | undefined;

export type RegisterState = { error?: string } | undefined;

// Email 直接註冊：建立會員（密碼雜湊）後自動登入
export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { error: "請輸入正確的 Email" };
  if (!name) return { error: "請輸入姓名" };
  if (!/^09\d{8}$/.test(phone))
    return { error: "手機號碼格式不正確（需為 09 開頭共 10 碼）" };
  if (password.length < 6) return { error: "密碼至少需 6 碼" };

  // Email 不可重複（含內建測試帳號）
  if (testUsers.some((u) => u.email === email) || (await findUserByEmail(email)))
    return { error: "此 Email 已被註冊，請直接登入" };

  const passwordHash = await hashPassword(password);
  await createCustomer({ email, name, phone, passwordHash });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return { error: "註冊成功，但自動登入失敗，請手動登入" };
    throw error; // NEXT_REDIRECT：讓導頁生效
  }
  return undefined;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    // signIn 成功時會丟出 NEXT_REDIRECT，必須重新拋出讓導頁生效
    if (error instanceof AuthError) {
      return { error: "帳號或密碼錯誤" };
    }
    throw error;
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

// 用 LINE 登入（導向 LINE 授權頁）
export async function lineSignInAction() {
  await signIn("line", { redirectTo: "/" });
}
