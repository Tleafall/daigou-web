import type { Metadata } from "next";
import { getSettings } from "@/lib/settings-store";
import { ContactLines, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "隱私權政策" };

// 依個人資料保護法第 8 條應告知事項撰寫。內容如有調整，請同步修改「最後更新」日期。
export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <LegalPage title="隱私權政策" updated="2026-11-06">
      <p>
        {s.name}（以下稱「本店」）重視您的個人資料保護。以下說明本店依《個人資料保護法》蒐集、處理及利用您個人資料的方式，
        請您在使用本網站前詳細閱讀。
      </p>

      <section>
        <h2>一、蒐集目的</h2>
        <ul>
          <li>處理訂單、安排 7-11 門市取貨及取貨付款。</li>
          <li>會員帳號管理與身分驗證。</li>
          <li>客戶服務、退換貨及售後聯繫。</li>
          <li>改善網站服務與商品推薦（以統計方式分析瀏覽紀錄）。</li>
        </ul>
      </section>

      <section>
        <h2>二、蒐集的個人資料類別</h2>
        <ul>
          <li>會員資料：姓名、Email、密碼（以加密方式儲存，本店無法得知原始密碼）。</li>
          <li>使用 LINE 登入時：LINE 提供的顯示名稱與使用者識別碼。</li>
          <li>訂單資料：收件人姓名、手機號碼、取貨門市、訂購商品與金額、訂單備註。</li>
          <li>使用紀錄：瀏覽的商品、搜尋關鍵字、加入購物車紀錄、IP 位址，以及用來辨識同一台裝置的匿名編號（Cookie）。</li>
        </ul>
      </section>

      <section>
        <h2>三、利用期間、地區、對象及方式</h2>
        <ul>
          <li>期間：自蒐集之日起，至您刪除帳號或蒐集目的消失為止；交易相關資料依法令規定的保存期限保存。</li>
          <li>地區：中華民國境內，以及本店使用之雲端服務（如資料備份）所在地區。</li>
          <li>對象：本店；為完成配送，會將收件人姓名、手機及取貨門市提供給物流業者（統一超商「賣貨便」）；依法令要求時提供給司法或主管機關。</li>
          <li>方式：以電子方式處理與保存，僅在上述目的範圍內利用。本店不會將您的個人資料出售或提供給其他第三人作行銷使用。</li>
        </ul>
      </section>

      <section>
        <h2>四、Cookie 與瀏覽器儲存</h2>
        <p>本網站使用 Cookie 及瀏覽器儲存空間，用於：維持登入狀態、記住購物車內容、辨識同一位訪客的瀏覽行為（匿名編號，不含姓名等可直接識別身分的資料）。您可在瀏覽器設定中清除或封鎖 Cookie，但部分功能（如登入、購物車）可能因此無法正常使用。</p>
      </section>

      <section>
        <h2>五、您的權利</h2>
        <p>依《個人資料保護法》第 3 條，您可以向本店請求：</p>
        <ul>
          <li>查詢或請求閱覽您的個人資料。</li>
          <li>請求製給複製本。</li>
          <li>請求補充或更正。</li>
          <li>請求停止蒐集、處理或利用。</li>
          <li>請求刪除。</li>
        </ul>
        <p>如需行使上述權利，請透過下方聯絡方式與本店聯繫。</p>
      </section>

      <section>
        <h2>六、不提供個人資料的影響</h2>
        <p>您可以自由選擇是否提供個人資料。但若未提供訂購及取貨所需資料（如收件人姓名、手機、取貨門市），本店將無法為您完成訂單。</p>
      </section>

      <section>
        <h2>七、資料安全</h2>
        <p>本店採取合理的技術措施保護您的個人資料，包括密碼加密儲存、網站全程加密連線（HTTPS）、後台僅限管理人員登入，並定期備份資料。</p>
      </section>

      <section>
        <h2>八、政策修訂</h2>
        <p>本店得視需要修訂本政策，修訂後將公告於本頁，並更新上方的「最後更新」日期。</p>
      </section>

      <section>
        <h2>九、聯絡我們</h2>
        <ContactLines email={s.email} lineId={s.lineId} lineUrl={s.lineUrl} />
      </section>
    </LegalPage>
  );
}
