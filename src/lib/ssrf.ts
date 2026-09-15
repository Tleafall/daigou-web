// 防 SSRF：只允許指向「外部公開位址」的 http/https 網址，擋掉內網/loopback。
// 用於後台批次匯入時，伺服器端去抓 Excel 裡填的圖片網址。
import { lookup } from "node:dns/promises";
import net from "node:net";

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true; // 不確定就擋
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // 本機 / 私有
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 私有
  if (a === 192 && b === 168) return true; // 私有
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / 保留
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const s = ip.toLowerCase();
  if (s === "::1" || s === "::") return true; // loopback / 未指定
  if (s.startsWith("fe80")) return true; // link-local
  if (s.startsWith("fc") || s.startsWith("fd")) return true; // unique-local
  const m = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
  if (m) return isPrivateIPv4(m[1]);
  return false;
}

function isPrivateIP(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return isPrivateIPv4(ip);
  if (v === 6) return isPrivateIPv6(ip);
  return true; // 認不得就當作不安全
}

// 網址是否指向外部公開位址（協定僅 http/https，主機解析出的 IP 不能是內網）
export async function isPublicHttpUrl(raw: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname;
  if (net.isIP(host)) return !isPrivateIP(host); // 直接填 IP
  if (host === "localhost" || host.endsWith(".localhost")) return false;

  try {
    const addrs = await lookup(host, { all: true });
    if (addrs.length === 0) return false;
    return addrs.every((a) => !isPrivateIP(a.address)); // 全部解析結果都要是公開位址
  } catch {
    return false;
  }
}
