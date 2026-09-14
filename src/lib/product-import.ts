import * as XLSX from "xlsx";

// 匯入用的欄位（表頭）
export const IMPORT_HEADERS = ["商品名稱", "分類", "售價", "庫存", "商品敘述"] as const;

export type RawRow = {
  title: string;
  category: string;
  price: number;
  stock: number;
  description: string;
};

// 產生 Excel 範本（含表頭與範例列）
export function buildTemplateBuffer(categoryNames: string[]): Buffer {
  const c1 = categoryNames[0] ?? "美妝保養";
  const c2 = categoryNames[1] ?? c1;
  const rows: (string | number)[][] = [
    [...IMPORT_HEADERS],
    ["日本保濕面膜（範例，可刪）", c1, 350, 20, "海外代購正品，實際顏色以實物為準。"],
    ["韓國護唇膏（範例，可刪）", c2, 180, 50, ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 26 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 42 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "商品");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

// 解析上傳的 Excel / CSV，回傳每一列
export function parseRows(buffer: Buffer): RawRow[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
  return json.map((r) => ({
    title: String(r["商品名稱"] ?? "").trim(),
    category: String(r["分類"] ?? "").trim(),
    price: Math.floor(Number(r["售價"])) || 0,
    stock: Math.max(0, Math.floor(Number(r["庫存"])) || 0),
    description: String(r["商品敘述"] ?? "").trim(),
  }));
}
