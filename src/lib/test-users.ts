// ⚠️ 僅供帳密登入「測試」使用。
// 正式版會改為：資料庫的 User 表 + 密碼雜湊（或直接用 Google/LINE 登入）。
export type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
};

export const testUsers: TestUser[] = [
  {
    id: "u-admin",
    email: "admin@test.com",
    password: "admin1234",
    name: "管理員（姑姑）",
    role: "ADMIN",
  },
  {
    id: "u-customer",
    email: "customer@test.com",
    password: "user1234",
    name: "測試顧客",
    role: "CUSTOMER",
  },
];
