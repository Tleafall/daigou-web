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
};

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
    }))
    .sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""));
}
