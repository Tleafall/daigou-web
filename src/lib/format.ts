// 金額一律以整數台幣儲存與計算（見 PLAN.md）
export function formatTWD(amount: number): string {
  return `NT$${amount.toLocaleString("zh-TW")}`;
}
