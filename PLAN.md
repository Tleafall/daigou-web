# 代購網站 — 實作計畫（v2.1，schema 定稿）

## 專案定位
為代購賣家打造的響應式電商網站（手機／PC 共用一套網頁，非 App），含會員登入、
商品分類與分頁、商品詳情、多規格（尺寸／顏色等）、購物車、結帳與後台管理。
參考蝦皮的網站結構。定位為「可安全營運的小型代購電商 MVP」。

> 狀態：架構與資料結構已定稿，進入實作。不再做全面重規劃，只在實作中微調。

## 架構決策（已定案）

| 項目 | 決定 | 備註 |
|------|------|------|
| 做法 | 自建 | Next.js 前後端一體 |
| 前端框架 | Next.js (App Router) + TypeScript | 響應式 |
| 樣式 | Tailwind CSS | 手機/PC 自適應 |
| 資料庫 | PostgreSQL（Neon 免費起步）| 升級付費見下 |
| ORM | Prisma | 交易用 Serializable + P2034 重試 |
| 登入 | Auth.js：Google + LINE，標準 User+Account 雙表 | email 相容性需先 spike |
| 圖片儲存 | Cloudinary，API Secret 僅伺服器端、上傳限管理員 | Phase 2 即做安全上傳 |
| 主機 | Vercel 免費(Hobby)：僅供開發/測試/展示 | 正式接單前必須升級 |
| 商品型態 | 現貨為主 | 有庫存數，下單即可出貨 |
| 金流 | 第一版：下單 + 貨到付款 | 線上金流（綠界/藍新）預留 |
| 金額 | 一律整數台幣（590 存 590）| 預留 currency 欄位 |

### 費用預期
- 開發與測試階段：接近 0 元
- 正式營運階段：需編列商用主機、資料庫、圖片流量與備份費用（約每月 US$5–25）
- 網域：約每年台幣 300–500
- 之後若接線上金流：信用卡約 2–3% 手續費

### 重要限制
- Vercel Hobby 僅供開發/測試/展示；正式接單前必須升級。
- 搬遷主機：核心邏輯可攜，但部署、DB 連線池、圖片服務、Next 圖片最佳化、
  網域/SSL、備份監控需重新設定——非「無痛零改」。
- 「Next.js SEO 佳」= 提供工具，仍須實作 metadata/sitemap/robots/JSON-LD。

## 權限模型（管理員 / 一般帳號）

- `User.role`：`CUSTOMER | ADMIN`，預設 `CUSTOMER`。
- 第一個 admin：一次性 bootstrap。`BOOTSTRAP_ADMIN_EMAILS` 僅在「系統尚無任何
  ADMIN」時生效一次，且只接受 Google `email_verified=true` 的帳號；不在每次登入
  自動升權（避免降權後又自動升回）。之後的 admin 由既有 admin 在後台授權並寫 AuditLog。
- 沒有任何 API 能讓使用者修改自己的 role。
- `/admin/**` 於 server layout 擋一層；每個後台 Server Action / Route Handler
  進入時再驗一次 `role === ADMIN`（middleware 只做導頁體驗，非唯一防線）。
- 前端隱藏後台入口僅為體驗，安全一律伺服器端驗證。

## 資料庫結構（v2.1，定稿）

```
User            id, name(nullable), email(nullable), phone(nullable),
                role(CUSTOMER/ADMIN), status(ACTIVE/DELETED), deletedAt(nullable),
                createdAt, updatedAt
Account         id, userId, provider(google/line), providerAccountId,   // Auth.js 標準
                @@unique([provider, providerAccountId])
                // 不在未登入狀態依相同 email 自動合併；綁定須已登入後重新驗證 OAuth

Category        id, name, slug(unique), sortOrder, parentId(nullable)
                // 最多兩層；父分類不能指向自己；刪除有商品/子分類時 Restrict

Product         id, title, description, categoryId,
                status(DRAFT/ACTIVE/ARCHIVED), publishedAt(nullable),
                createdAt, updatedAt                                     // 下架用 ARCHIVED，不硬刪
ProductImage    id, productId, publicId, secureUrl, altText,
                sortOrder, isPrimary, width(nullable), height(nullable), createdAt
ProductOption   id, productId, name(顏色/尺寸), sortOrder
OptionValue     id, optionId, value(紅/藍/S/M), sortOrder
ProductVariant  id, productId, sku(unique), price(整數), stock,
                status(ACTIVE/ARCHIVED), combinationKey,
                @@unique([productId, combinationKey])
                // 後台限制規格類型 2~3 種，避免組合爆炸
VariantOptionValue  variantId, optionValueId
                // 同一 Variant 在同一 Option 下只能一個 OptionValue

Cart            id, userId(unique)   // 未登入用瀏覽器 localStorage，登入後合併
CartItem        cartId, variantId, quantity, @@unique([cartId, variantId]),
                @@index([variantId])

Order           id, orderNo(unique), userId(nullable),
                idempotencyKey, @@unique([userId, idempotencyKey]),
                orderStatus, paymentStatus, fulfillmentStatus,
                paymentMethod(COD), shippingMethod,
                subtotal, shippingFee, codFee, discountAmount, totalAmount, currency,
                recipientName, recipientPhone, postalCode, city, district, addressLine,
                trackingNumber(nullable), carrier(nullable),
                customerNote, internalNote, cancellationReason,
                createdAt, updatedAt, confirmedAt, shippedAt, completedAt, cancelledAt
                // version Int 樂觀鎖：可選，多管理員時再加
OrderItem       orderId, productId(nullable), variantId(nullable),
                skuSnapshot, productNameSnapshot, variantNameSnapshot,
                optionSnapshot(JSON), imageUrlSnapshot,
                unitPrice, quantity, lineTotal                          // 完整快照
InventoryMovement  id, variantId, orderId(nullable), orderItemId(nullable),
                   type(SALE/RESTOCK/CANCEL/ADJUSTMENT),
                   quantityDelta(帶正負：SALE -n, CANCEL +n, RESTOCK +n),
                   reason, operatorId(nullable),
                   idempotencyKey(unique), createdAt, @@index([variantId, createdAt])

CustomerRiskProfile  userId(unique),                                    // 僅 admin 可讀
                     totalOrders, completedOrders,
                     customerCancelCount, codAbandonCount,
                     riskScore, manualFlag(NORMAL/WATCH/BLOCKED),
                     sellerNote, lastOrderAt, updatedAt

Address         id, userId, ...（選配，常用收件地址）
AdminAuditLog   adminUserId, action, entityType, entityId,
                beforeData, afterData, ipAddress, createdAt
```

### 狀態枚舉
```
OrderStatus:        PENDING, CONFIRMED, CANCELLED, COMPLETED
PaymentStatus:      PENDING, PAID, FAILED, REFUNDED   // 退款 v1 人工
FulfillmentStatus:  UNFULFILLED, PACKING, SHIPPED, DELIVERED, RETURNED  // 退貨 v1 人工
```

### 合法狀態轉換（集中在 OrderService，禁止任意改 enum）
```
建立訂單:  Order=PENDING, Payment=PENDING, Fulfillment=UNFULFILLED
確認:      PENDING → CONFIRMED
包貨:      Fulfillment UNFULFILLED → PACKING
出貨:      PACKING → SHIPPED
送達收款:  SHIPPED → DELIVERED；Payment PENDING → PAID；Order CONFIRMED → COMPLETED
取消:      僅 PENDING/CONFIRMED 且尚未 SHIPPED；回補庫存並更新 RiskProfile
拒收/退回: SHIPPED/DELIVERED → RETURNED；Payment 視結果維持 PENDING 或 FAILED；
           若 COD 未收款則 codAbandonCount += 1
```

### 核心規則
- **扣庫存在同一 DB 交易內**，主要防超賣手段是條件式更新：
  `UPDATE ProductVariant SET stock=stock-qty WHERE id=? AND stock>=qty`，
  更新 0 筆＝庫存不足、不建單。交易用 Serializable，遇 P2034 重試。
- 多商品訂單：variant 依 id 排序後再更新，降低死結。
- **交易保持短小**：Cloudinary / Email / LINE 等外部呼叫一律在交易「成功後」才做。
- 訂單建立即扣庫存；取消時系統補回（寫帶 idempotencyKey 的 InventoryMovement，
  防止重複取消重複補庫存）。取消用條件式狀態更新，只有成功轉 CANCELLED 的那次才補。
- 結帳金額一律**伺服器端重算**，不信任前端價格。
- 沒規格的商品也建一筆預設 Variant，價格全放 Variant。
- `idempotencyKey`：結帳頁產生 UUID，重複提交回傳原訂單、不重複扣庫存。

### Next.js 快取策略
- 可快取：首頁、分類頁、商品敘述、商品售價「展示」。
- 不可信快取（一律即時查 DB）：結帳價格、即時庫存、購物車驗證、訂單狀態、後台。
- 後台更新商品後呼叫 revalidateTag / revalidatePath 做 on-demand 失效。

### 索引
```
Product      @@index([categoryId, status, createdAt])
Order        @@index([userId, createdAt])
Order        @@index([orderStatus, createdAt])
Order        @@index([fulfillmentStatus, createdAt])
```

## 客戶風險分數（僅賣家可見）

- `CustomerRiskProfile` 與 User 一對一，所有欄位僅 admin 端查詢/回傳，前台 API 不含。
- 計數於 OrderService 狀態轉換時更新（完成 / 客人取消 / COD 棄單）。
- 起始分數公式（透明可調）：
  `riskScore = clamp(100 + completedOrders*2 - customerCancelCount*10 - codAbandonCount*25, 0, 100)`
  低風險 ≥70｜⚠️觀察 40–69｜🚫高風險 <40。後台同時顯示原始數字，不做黑箱。
- 新訂單若客戶 codAbandonCount>0 或 manualFlag=WATCH/BLOCKED，於後台 PENDING 訂單跳警示。
- manualFlag=BLOCKED 的帳號，結帳 API 直接擋。
- 屬「內部風險管理」個資利用目的，列入隱私權告知。

## 頁面清單

### 前台（客人）
1. 首頁 — 輪播、分類入口、熱門/最新商品
2. 分類頁 / 搜尋結果 — 商品格狀列表 + 翻頁
3. 商品詳情 — 多圖、敘述、選規格、選數量、加入購物車
4. 購物車（訪客可加，登入後合併）
5. 結帳 — 收件人/電話/地址、貨到付款、送出（idempotency 防重複）
6. 會員中心 — 我的訂單、狀態、常用地址、取消申請、帳號/個資刪除（停用+匿名化）

### 後台（role=ADMIN，動作皆伺服器端重驗）
7. 商品管理 — 新增/編輯、安全圖片上傳、規格與庫存、上下架封存
8. 訂單管理 — 狀態機、確認、出貨、取消原因、庫存回補、客戶風險分數與備註
9. 分類管理、管理員授權、AdminAuditLog

## 開發階段

- 階段 0：Auth spike + schema 定稿 + 規則定案
  - Auth.js 實測：Google Login＋Prisma Adapter、有 email 的 LINE、無 email 的 LINE；
    確認 User.email nullable 是否能用官方 Adapter，不行則自訂 Adapter 或限制 LINE email
  - 帳號綁定：不依相同 email 自動合併
  - Prisma schema 全部定稿
  - 業務規則定案（見下方預設值）
- 階段 1：骨架、登入與權限 — 前台版面、Google/LINE 登入、訪客購物車、
  admin bootstrap、Server Action 權限驗證、基本輸入驗證
- 階段 2：商品與規格 — Category、Product、ProductImage(安全上傳)、Option/OptionValue、
  Variant/VariantOptionValue、SKU、搜尋分頁、SEO metadata/sitemap/robots、快取策略
- 階段 3：購物車與庫存交易 — 購物車合併、伺服器端價格重算、
  Serializable 庫存交易防超賣、InventoryMovement、購買數量限制
- 階段 4：結帳與訂單 — 電話/地址驗證、運費、codFee、Order/OrderItem 快照、貨到付款、
  訂單成立通知、idempotencyKey 防重、**貨到付款防濫用（rate limit、金額/數量上限、
  同帳號頻率、風險分數擋 BLOCKED、必要時人工電話確認）**
- 階段 5：會員與售後 — 我的訂單、狀態、取消申請、常用地址、帳號刪除(停用+匿名化)
- 階段 6：後台 — 商品與庫存、OrderService 狀態機、庫存回補、客戶風險分數/備註、
  管理員授權、AdminAuditLog
- 階段 7：正式上線準備（見檢查清單）

## 業務規則預設值（可改）
- 貨到付款單筆上限：NT$10,000
- 同一商品單次購買上限：10 件
- 運費：宅配 NT$100、滿 NT$1,000 免運（後台可設）
- 離島配送：不配（先只做本島）
- 取消/退貨：v1 管理員後台手動處理

## 上線前檢查清單（Phase 7）
- [ ] 改用商用主機，資料庫升級不休眠
- [ ] 每日 pg_dump 備份 + migration 前備份 + 實測還原
- [ ] 錯誤監控與告警
- [ ] 圖片：孤兒圖清理、額度監控
- [ ] LINE 出貨通知改用 LINE Official Account + Messaging API（LINE Notify 已停用）
- [ ] 法律頁：服務條款、隱私權與個資蒐集告知（含客戶風險分數利用目的）、
      付款/配送/運費、取消規則、退換貨政策、七日解除權及例外、發票/收據、申訴管道
- [ ] 賣家資訊揭露：名稱、統編、客服聯絡
- [ ] 稅籍登記、發票/憑證義務（會計師/記帳士確認）
- [ ] 行動裝置測試、壓力測試、真實訂單完整演練

## 待準備（賣家/使用者提供）
- Google Cloud OAuth 用戶端
- LINE Login channel（email 權限需另申請且不保證取得）
- Neon 連線字串、Cloudinary 帳號
- BOOTSTRAP_ADMIN_EMAILS（初始管理員 Google email）
- 品牌名稱/Logo、配色/參考網站、幾筆真實商品資料
- 出貨方式：宅配貨到付款，是否也要超商店到店
