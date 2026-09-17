// 示範用假資料（骨架階段）。之後會由 Prisma 從資料庫讀取，型別刻意貼近 schema。

export type Category = {
  slug: string;
  name: string;
  emoji: string;
  sortOrder: number;
};

export type OptionGroup = {
  name: string; // 例：顏色、尺寸
  values: string[];
};

export type Variant = {
  id: string;
  options: Record<string, string>; // 例：{ 顏色: "紅", 尺寸: "M" }
  price: number; // 整數台幣
  stock: number;
};

export type ProductStatus = "ACTIVE" | "ARCHIVED" | "DRAFT";

// 商品圖；tag 對應某個規格選項值（如「紅色」），選到時圖庫會跳到這張
// publicId：Cloudinary 圖片 id（有上雲才有），供日後刪圖/找孤兒圖
export type ProductImage = { url: string; tag?: string; publicId?: string };

export type Product = {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  description: string;
  price: number; // 最低規格價（列表顯示用）
  gradient: [string, string]; // 佔位圖漸層（無上傳圖時的底色）
  images: ProductImage[]; // 商品圖（data URL），images[0] 為封面；可標記對應規格
  optionGroups: OptionGroup[];
  variants: Variant[];
  status: ProductStatus;
  views: number; // 商品頁瀏覽次數
};

export const seedCategories: Category[] = [
  { slug: "beauty", name: "美妝保養", emoji: "💄", sortOrder: 0 },
  { slug: "fashion", name: "服飾配件", emoji: "👗", sortOrder: 1 },
  { slug: "home", name: "居家生活", emoji: "🏠", sortOrder: 2 },
  { slug: "food", name: "食品零食", emoji: "🍪", sortOrder: 3 },
  { slug: "baby", name: "母嬰親子", emoji: "🍼", sortOrder: 4 },
  { slug: "digital", name: "3C 周邊", emoji: "🎧", sortOrder: 5 },
];

function seedCategoryName(slug: string): string {
  return seedCategories.find((c) => c.slug === slug)?.name ?? "商品";
}

type RawProduct = {
  title: string;
  cat: string;
  price: number;
  g: [string, string];
  opts?: OptionGroup[];
};

const raw: RawProduct[] = [
  { title: "日本溫和胺基酸洗面乳", cat: "beauty", price: 390, g: ["#ffd9c7", "#ff9e7d"], opts: [{ name: "容量", values: ["120ml", "200ml"] }] },
  { title: "韓國水潤保濕精華液", cat: "beauty", price: 620, g: ["#ffe0ec", "#ff9ec2"], opts: [{ name: "款式", values: ["保濕", "提亮", "抗皺"] }] },
  { title: "法國香氛護手霜組", cat: "beauty", price: 480, g: ["#e9dcff", "#b79bff"] },
  { title: "日系霧面唇釉", cat: "beauty", price: 350, g: ["#ffd3d3", "#ff8f8f"], opts: [{ name: "色號", values: ["蜜桃", "楓葉", "豆沙", "正紅"] }] },
  { title: "純棉寬鬆落肩上衣", cat: "fashion", price: 590, g: ["#d7ecff", "#8fc4ff"], opts: [{ name: "顏色", values: ["米白", "霧灰", "墨黑"] }, { name: "尺寸", values: ["S", "M", "L", "XL"] }] },
  { title: "韓版高腰寬褲", cat: "fashion", price: 780, g: ["#dbe4ff", "#9db2ff"], opts: [{ name: "顏色", values: ["卡其", "黑"] }, { name: "尺寸", values: ["S", "M", "L"] }] },
  { title: "真皮簡約肩背包", cat: "fashion", price: 1280, g: ["#ffe8cf", "#ffc178"], opts: [{ name: "顏色", values: ["焦糖", "奶茶", "黑"] }] },
  { title: "純銀細鍊項鍊", cat: "fashion", price: 690, g: ["#eaf0f2", "#c3d0d6"] },
  { title: "北歐風陶瓷馬克杯", cat: "home", price: 320, g: ["#d6f0e6", "#8fd7bd"], opts: [{ name: "顏色", values: ["霧白", "灰藍", "陶土"] }] },
  { title: "日本無印風收納籃", cat: "home", price: 250, g: ["#efeadf", "#cbbfa3"], opts: [{ name: "尺寸", values: ["小", "中", "大"] }] },
  { title: "香氛蠟燭禮盒", cat: "home", price: 850, g: ["#ffeede", "#ffcf9e"] },
  { title: "日本人氣抹茶夾心餅", cat: "food", price: 180, g: ["#e4f0cf", "#b6d97f"] },
  { title: "韓國蜂蜜奶油洋芋片", cat: "food", price: 150, g: ["#fff2c9", "#ffdd73"], opts: [{ name: "口味", values: ["原味", "起司", "辣味"] }] },
  { title: "泰國手標奶茶隨手包", cat: "food", price: 220, g: ["#f6ddc4", "#e0a978"] },
  { title: "嬰兒有機純棉包巾", cat: "baby", price: 420, g: ["#dbeeff", "#9cd0ff"], opts: [{ name: "花色", values: ["雲朵", "小熊", "星星"] }] },
  { title: "矽膠學習餐具組", cat: "baby", price: 360, g: ["#ffe3ef", "#ffa9cc"], opts: [{ name: "顏色", values: ["粉", "綠", "灰"] }] },
  { title: "無線藍牙耳機", cat: "digital", price: 1590, g: ["#dfe3ff", "#a2acff"], opts: [{ name: "顏色", values: ["白", "黑"] }] },
  { title: "快充編織傳輸線", cat: "digital", price: 240, g: ["#e0f5ff", "#8fd6ff"], opts: [{ name: "接頭", values: ["USB-C", "Lightning"] }, { name: "長度", values: ["1m", "2m"] }] },
];

function cartesian(groups: OptionGroup[]): Record<string, string>[] {
  if (groups.length === 0) return [{}];
  return groups.reduce<Record<string, string>[]>(
    (acc, g) => acc.flatMap((combo) => g.values.map((v) => ({ ...combo, [g.name]: v }))),
    [{}],
  );
}

function slugify(title: string, i: number): string {
  return `p${i + 1}`;
}

export const seedProducts: Product[] = raw.map((item, i) => {
  const slug = slugify(item.title, i);
  const groups = item.opts ?? [];
  const combos = cartesian(groups);
  const variants: Variant[] = combos.map((options, j) => ({
    id: `${slug}-v${j + 1}`,
    options,
    price: item.price + (groups.length > 0 ? j * 20 : 0),
    stock: (i * 7 + j * 3) % 9, // 0..8，部分為 0 以示範售罄
  }));
  const price = Math.min(...variants.map((v) => v.price));
  return {
    id: slug,
    slug,
    title: item.title,
    categorySlug: item.cat,
    description: `海外人氣${seedCategoryName(item.cat)}。此為代購商品，下單後由賣家統一整理出貨；商品皆為正品，實際顏色以實物為準。運送方式為 7-11 賣貨便，商品寄到您指定的門市，到店取貨付款。`,
    price,
    gradient: item.g,
    images: [],
    optionGroups: groups,
    variants,
    status: "ACTIVE",
    views: 0,
  };
});

// 可用漸層色（新增商品挑選用）
export const gradientPresets: [string, string][] = [
  ["#ffd9c7", "#ff9e7d"],
  ["#ffe0ec", "#ff9ec2"],
  ["#e9dcff", "#b79bff"],
  ["#d7ecff", "#8fc4ff"],
  ["#d6f0e6", "#8fd7bd"],
  ["#fff2c9", "#ffdd73"],
  ["#dfe3ff", "#a2acff"],
  ["#efeadf", "#cbbfa3"],
];
