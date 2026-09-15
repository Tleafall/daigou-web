// ⚠️ 原型用「伺服器記憶體」客服訊息。重啟伺服器會清空。之後接 Prisma。

export type ChatProduct = {
  slug: string;
  title: string;
  price: number;
  image?: string;
  gradient: [string, string];
};

export type ChatMessage = {
  id: string;
  sender: "customer" | "admin" | "bot";
  text: string;
  createdAt: string;
  product?: ChatProduct; // 詢問中的商品（蝦皮式）
};

export type Conversation = {
  userId: string;
  userName: string;
  userEmail: string;
  messages: ChatMessage[];
  adminReadAt?: string; // 賣家最後讀取時間
  customerReadAt?: string; // 顧客最後讀取時間
};

// 該對話對「賣家」而言有未讀（顧客有新訊息）
function unreadForAdmin(c: Conversation): boolean {
  const since = c.adminReadAt ?? "";
  return c.messages.some((m) => m.sender === "customer" && m.createdAt > since);
}

// 該對話對「顧客」而言有未讀（賣家/機器人有新回覆）
function unreadForCustomer(c: Conversation): boolean {
  const since = c.customerReadAt ?? "";
  return c.messages.some(
    (m) => (m.sender === "admin" || m.sender === "bot") && m.createdAt > since,
  );
}

type Store = { conversations: Map<string, Conversation>; seq: number };

const g = globalThis as unknown as { __daigouChat?: Store };

function getStore(): Store {
  if (!g.__daigouChat) g.__daigouChat = { conversations: new Map(), seq: 1 };
  return g.__daigouChat;
}

function ensure(userId: string, userName: string, userEmail: string): Conversation {
  const store = getStore();
  let c = store.conversations.get(userId);
  if (!c) {
    c = { userId, userName, userEmail, messages: [] };
    store.conversations.set(userId, c);
  } else {
    c.userName = userName || c.userName;
    c.userEmail = userEmail || c.userEmail;
  }
  return c;
}

export function sendMessage(
  userId: string,
  sender: "customer" | "admin" | "bot",
  text: string,
  meta?: { userName?: string; userEmail?: string; product?: ChatProduct },
) {
  const store = getStore();
  const c = ensure(userId, meta?.userName ?? "", meta?.userEmail ?? "");
  c.messages.push({
    id: `msg-${store.seq++}`,
    sender,
    text,
    createdAt: new Date().toISOString(),
    product: meta?.product,
  });
}

export function getConversation(userId: string): Conversation | undefined {
  return getStore().conversations.get(userId);
}

export function hasSellerReply(userId: string): boolean {
  const c = getStore().conversations.get(userId);
  return !!c?.messages.some((m) => m.sender === "admin" || m.sender === "bot");
}

export function listConversations() {
  return [...getStore().conversations.values()]
    .map((c) => ({
      userId: c.userId,
      userName: c.userName,
      userEmail: c.userEmail,
      messageCount: c.messages.length,
      last: c.messages[c.messages.length - 1],
      unread: unreadForAdmin(c),
    }))
    .sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""));
}

// ---- 未讀標記 ----
export function markReadByAdmin(userId: string) {
  const c = getStore().conversations.get(userId);
  if (c) c.adminReadAt = new Date().toISOString();
}

export function markReadByCustomer(userId: string) {
  const c = getStore().conversations.get(userId);
  if (c) c.customerReadAt = new Date().toISOString();
}

// 賣家後台待處理的對話數（有顧客新訊息未讀）
export function adminUnreadCount(): number {
  return [...getStore().conversations.values()].filter(unreadForAdmin).length;
}

// 顧客是否有未讀的賣家回覆
export function customerHasUnread(userId: string): boolean {
  const c = getStore().conversations.get(userId);
  return c ? unreadForCustomer(c) : false;
}
