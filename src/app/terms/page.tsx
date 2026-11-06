import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings-store";
import { ContactLines, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "服務條款" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="服務條款" updated="2026-11-06">
      <p>
        歡迎使用 {s.name}（以下稱「本店」）網站。當您註冊會員或在本網站下單，即表示您已閱讀、了解並同意以下條款。
      </p>

      <section>
        <h2>一、服務內容</h2>
        <p>本店提供海外商品代購與現貨販售，並透過統一超商「賣貨便」寄送至您指定的 7-11 門市，採取貨付款。商品圖片僅供參考，實際顏色、包裝可能因拍攝光線、螢幕顯示或原廠更新而略有差異，以實際收到的商品為準。</p>
      </section>

      <section>
        <h2>二、會員帳號</h2>
        <ul>
          <li>註冊時請提供真實、正確的資料，並妥善保管帳號密碼。</li>
          <li>透過您帳號進行的操作，視為您本人的行為。發現帳號遭他人使用時，請立即通知本店。</li>
        </ul>
      </section>

      <section>
        <h2>三、訂單成立</h2>
        <ul>
          <li>您送出訂單後，本店會進行確認。若遇商品缺貨、價格標示明顯錯誤或其他無法出貨的情形，本店會與您聯繫，並得取消該訂單；已收款項將全額退還。</li>
          <li>商品價格以下單當時頁面標示為準。</li>
        </ul>
      </section>

      <section>
        <h2>四、付款與取貨</h2>
        <ul>
          <li>付款方式為 7-11 門市取貨付款，請於包裹到店後依通知期限內取貨。</li>
          <li>為維護其他顧客的權益，同一帳號同時未完成的訂單數有上限。</li>
          <li>若多次下單後未取貨，本店得暫停該帳號的下單權限。</li>
        </ul>
      </section>

      <section>
        <h2>五、促銷活動</h2>
        <p>本店舉辦的促銷活動（如前 N 名下單贈品）以活動頁面公告的內容為準，名額或數量有限，送完為止。訂單取消時，該筆訂單所佔的活動名額將釋出給其他顧客。</p>
      </section>

      <section>
        <h2>六、退換貨</h2>
        <p>
          退換貨方式請見<Link href="/returns" className="text-brand hover:underline">退換貨說明</Link>。
        </p>
      </section>

      <section>
        <h2>七、禁止行為</h2>
        <ul>
          <li>以不實資料註冊或下單、惡意大量下單而不取貨。</li>
          <li>干擾網站正常運作，例如以程式大量存取、嘗試入侵系統。</li>
          <li>未經同意複製、轉載本網站的圖片與文字內容。</li>
        </ul>
        <p>違反上述規定者，本店得暫停或終止其會員資格。</p>
      </section>

      <section>
        <h2>八、個人資料</h2>
        <p>
          本店如何蒐集與使用您的個人資料，請見<Link href="/privacy" className="text-brand hover:underline">隱私權政策</Link>。
        </p>
      </section>

      <section>
        <h2>九、條款修訂與準據法</h2>
        <p>本店得視需要修訂本條款，修訂後將公告於本頁。本條款以中華民國法律為準據法；本條款未規定之事項，依《消費者保護法》等相關法令辦理。</p>
      </section>

      <section>
        <h2>十、聯絡我們</h2>
        <ContactLines email={s.email} lineId={s.lineId} lineUrl={s.lineUrl} />
      </section>
    </LegalPage>
  );
}
