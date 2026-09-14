import { auth } from "@/auth";
import { listCategories } from "@/lib/category-store";
import { buildTemplateBuffer } from "@/lib/product-import";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }
  const buf = buildTemplateBuffer(listCategories().map((c) => c.name));
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="products-template.xlsx"',
    },
  });
}
