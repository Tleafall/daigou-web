// 給搜尋引擎／分享預覽用的乾淨文字：拿掉 emoji、效期、「慶開幕」等時效字。
// 只用在 <title>、meta description、分享卡；網站上顯示的商品名稱維持老闆輸入的原樣。
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
const EXPIRY = /(有效)?(期限|效期)\s*[:：]?\s*\d{2,4}\s*[./\-年]\s*\d{1,2}(\s*[./\-月]\s*\d{1,2})?\s*日?/g;
const NOISE = /慶開幕|開幕慶|限時特價|限時優惠/g;

export function seoText(s: string): string {
  return s
    .replace(EMOJI, " ")
    .replace(EXPIRY, " ")
    .replace(NOISE, " ")
    .replace(/[~～]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,，、!！.。:：\-–—|｜]+|[\s,，、!！:：\-–—|｜]+$/g, "")
    .trim();
}

export function seoDescription(s: string, max = 150): string {
  const t = seoText(s.replace(/\r?\n+/g, " "));
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}
