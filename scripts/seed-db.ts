// 初始化 / 重置本機資料庫的示範資料（分類、商品、設定、示範訂單）。
// 執行：npx tsx scripts/seed-db.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedCategories, seedProducts } from "../src/lib/mock-data";
import { DEFAULTS } from "../src/lib/settings-store";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 清掉舊資料再重建（示範資料，安全）
  await prisma.inventoryMovement.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.counter.deleteMany();

  // 設定（單列）
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...DEFAULTS },
    update: { ...DEFAULTS },
  });

  // 分類
  await prisma.category.createMany({
    data: seedCategories.map((c) => ({
      slug: c.slug,
      name: c.name,
      emoji: c.emoji,
      sortOrder: c.sortOrder,
    })),
  });

  // 商品（規格/圖片/漸層以 JSON 保存；建立時間依序遞增以維持列表順序）
  const base = Date.now();
  for (let i = 0; i < seedProducts.length; i++) {
    const p = seedProducts[i];
    await prisma.product.create({
      data: {
        slug: p.slug,
        title: p.title,
        categorySlug: p.categorySlug,
        description: p.description,
        price: p.price,
        gradient: p.gradient,
        images: p.images,
        optionGroups: p.optionGroups,
        variants: p.variants,
        status: p.status,
        createdAt: new Date(base + i * 1000),
      },
    });
  }

  // 示範訂單（3 筆；對應測試顧客 u-customer）
  const now = Date.now();
  const storeInfo = {
    storeId: "287731",
    storeName: "BBS夢廣場店",
    storeAddress: "台北市信義區松高路11號6樓",
  };
  const demoOrders = [
    {
      seq: 1,
      status: "PENDING",
      minsAgo: 30,
      items: [
        {
          productSlug: "p5",
          productTitle: "純棉寬鬆落肩上衣",
          variantId: "p5-v1",
          optionLabel: "顏色：米白、尺寸：S",
          unitPrice: 590,
          quantity: 1,
          lineTotal: 590,
          gradient: ["#d7ecff", "#8fc4ff"],
        },
      ],
    },
    {
      seq: 2,
      status: "SHIPPED",
      minsAgo: 600,
      items: [
        {
          productSlug: "p17",
          productTitle: "無線藍牙耳機",
          variantId: "p17-v1",
          optionLabel: "顏色：白",
          unitPrice: 1590,
          quantity: 1,
          lineTotal: 1590,
          gradient: ["#dfe3ff", "#a2acff"],
        },
      ],
    },
    {
      seq: 3,
      status: "COMPLETED",
      minsAgo: 4320,
      items: [
        {
          productSlug: "p1",
          productTitle: "日本溫和胺基酸洗面乳",
          variantId: "p1-v1",
          optionLabel: "容量：120ml",
          unitPrice: 390,
          quantity: 2,
          lineTotal: 780,
          gradient: ["#ffd9c7", "#ff9e7d"],
        },
      ],
    },
  ];

  for (const o of demoOrders) {
    const subtotal = o.items.reduce((s, it) => s + it.lineTotal, 0);
    const shippingFee = subtotal >= 1000 ? 0 : 100;
    const ts = new Date(now - o.minsAgo * 60000);
    await prisma.order.create({
      data: {
        orderNo: `D${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, "0")}${String(
          ts.getDate(),
        ).padStart(2, "0")}${String(o.seq).padStart(4, "0")}`,
        userId: "u-customer",
        userEmail: "customer@test.com",
        userName: "測試顧客",
        status: o.status,
        items: o.items,
        subtotal,
        shippingFee,
        codFee: 0,
        totalAmount: subtotal + shippingFee,
        recipientName: "王小明",
        recipientPhone: "0912345678",
        ...storeInfo,
        createdAt: ts,
        updatedAt: ts,
      },
    });
  }

  // 訂單流水號從 3 之後接續
  await prisma.counter.create({ data: { name: "orderNo", value: demoOrders.length } });

  console.log(
    `Seed 完成：${seedCategories.length} 分類、${seedProducts.length} 商品、${demoOrders.length} 示範訂單`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
