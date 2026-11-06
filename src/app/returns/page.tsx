import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings-store";
import { ContactLines, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "退換貨說明" };

// 依《消費者保護法》第 19 條、第 19 條之 2，及《通訊交易解除權合理例外情事適用準則》第 2 條撰寫。
export default async function ReturnsPage() {
  const s = await getSettings();
  return (
    <LegalPage title="退換貨說明" updated="2026-11-06">
      <section>
        <h2>一、七天猶豫期</h2>
        <p>
          依《消費者保護法》第 19 條，網路購物的商品，您可以在<b>收到商品後 7 天內</b>，
          不需說明理由、不需負擔任何費用，以退回商品或書面通知的方式解除契約（退貨）。
        </p>
        <p>提醒：7 天猶豫期是讓您確認商品是否符合需要，不是試用期。退回的商品請保持完整，並附上所有配件、贈品與原包裝。</p>
      </section>

      <section>
        <h2>二、不適用七天猶豫期的商品</h2>
        <p>依《通訊交易解除權合理例外情事適用準則》第 2 條，下列商品<b>不適用</b>七天猶豫期：</p>
        <ul>
          <li><b>已拆封的個人衛生用品</b>：例如已拆封的化妝品、保養品、彩妝、內衣褲等。</li>
          <li><b>易於腐敗、保存期限較短</b>，或退貨時即將過期的商品：例如食品、零食。</li>
          <li>依您的要求<b>客製化</b>的商品。</li>
          <li>報紙、期刊或雜誌；經拆封的影音商品或電腦軟體。</li>
        </ul>
        <p>以上商品若有瑕疵或寄錯，仍可依第四點辦理。</p>
      </section>

      <section>
        <h2>三、如何申請退換貨</h2>
        <ol className="ml-5 list-decimal space-y-1">
          <li>
            登入後到「<Link href="/account/orders" className="text-brand hover:underline">我的訂單</Link>」，
            點選該筆訂單，按「申請退換貨」並說明原因；或直接透過下方官方 LINE 聯繫我們。
          </li>
          <li>本店確認後，會告知您退回商品的方式與寄送資訊。</li>
          <li>收到退回商品並確認後，最遲於 <b>15 天內</b>將款項退還給您（依《消費者保護法》第 19 條之 2）。因採取貨付款，退款將以銀行匯款方式辦理，屆時請提供您的帳戶資料。</li>
        </ol>
      </section>

      <section>
        <h2>四、商品瑕疵、寄錯或缺件</h2>
        <p>
          收到商品時若發現破損、瑕疵、寄錯或缺件，請於收到商品後 7 天內聯繫本店，並附上商品與外箱照片。
          經確認後，本店將負擔來回運費，為您更換或退款。建議拆封時全程錄影，方便釐清狀況。
        </p>
      </section>

      <section>
        <h2>五、未取貨</h2>
        <p>
          包裹到店後請於通知期限內取貨。逾期未取貨的包裹會退回本店，訂單將取消；
          多次未取貨者，本店得暫停其下單權限（詳見<Link href="/terms" className="text-brand hover:underline">服務條款</Link>）。
        </p>
      </section>

      <section>
        <h2>六、聯絡我們</h2>
        <ContactLines email={s.email} lineId={s.lineId} lineUrl={s.lineUrl} />
      </section>
    </LegalPage>
  );
}
