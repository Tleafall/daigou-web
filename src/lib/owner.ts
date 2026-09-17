// 網站「最高管理員（擁有者）」設定。
// 這個 Email 的帳號永遠是管理員：不可被取消管理員、不可被封鎖。
// 可用環境變數 OWNER_EMAIL 覆寫；沒設就用預設值。
export const OWNER_EMAIL = (process.env.OWNER_EMAIL ?? "yuchingmakeup@gmail.com")
  .trim()
  .toLowerCase();

export function isOwnerEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === OWNER_EMAIL;
}
