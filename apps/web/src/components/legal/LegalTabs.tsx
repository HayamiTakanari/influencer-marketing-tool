import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface Tab {
  id: 'terms' | 'privacy';
  label: string;
}

const tabs: Tab[] = [
  { id: 'terms', label: '利用規約' },
  { id: 'privacy', label: 'プライバシーポリシー' }
];

interface LegalTabsProps {
  defaultTab?: 'terms' | 'privacy';
}

export const LegalTabs: React.FC<LegalTabsProps> = ({ defaultTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultTab);
  const router = useRouter();

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/register');
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <nav className="flex flex-1 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <button
              onClick={handleClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {activeTab === 'terms' ? <TermsContent /> : <PrivacyContent />}
          </div>
        </div>
      </div>
    </div>
  );
};

const TermsContent: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">利用規約</h1>
      <p className="text-sm text-gray-500 mb-8">
        最終更新日: 2024年1月1日 | 施行日: 2024年1月1日
      </p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第1条（総則）</h2>
          <p className="text-gray-700 leading-relaxed">
            本利用規約（以下「本規約」といいます）は、株式会社InfluenceLink（以下「当社」といいます）が提供するインフルエンサーマーケティングプラットフォーム「InfluenceLink」（以下「本サービス」といいます）の利用条件を定めるものです。
          </p>
          <p className="text-gray-700 leading-relaxed mt-3">
            本サービスをご利用になる場合には、本規約の全ての条項に同意していただく必要があります。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第2条（定義）</h2>
          <p className="text-gray-700 leading-relaxed mb-3">本規約において使用する用語の定義は、以下のとおりとします。</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>「ユーザー」とは、本サービスを利用する全ての個人または法人をいいます。</li>
            <li>「インフルエンサー」とは、SNS等で影響力を持ち、本サービスを通じて企業案件を受託する個人をいいます。</li>
            <li>「クライアント」とは、本サービスを通じてインフルエンサーに業務を依頼する企業または個人をいいます。</li>
            <li>「コンテンツ」とは、本サービス上で提供される全ての情報、テキスト、画像、動画等をいいます。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第3条（アカウント登録）</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>ユーザーは、当社が定める方法により、アカウント登録を行うものとします。</li>
            <li>ユーザーは、登録情報について正確かつ最新の情報を提供するものとします。</li>
            <li>アカウントの管理責任はユーザーに帰属し、第三者による不正使用について当社は責任を負いません。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第4条（禁止事項）</h2>
          <p className="text-gray-700 leading-relaxed mb-3">ユーザーは、以下の行為を行ってはなりません。</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当社または第三者の知的財産権を侵害する行為</li>
            <li>当社または第三者の名誉または信用を毀損する行為</li>
            <li>本サービスの運営を妨害する行為</li>
            <li>不正アクセス行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第5条（料金および支払い）</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>本サービスの利用料金は、当社が別途定める料金表に従うものとします。</li>
            <li>料金の支払いは、当社が指定する方法により行うものとします。</li>
            <li>一度支払われた料金は、原則として返金されません。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第6条（知的財産権）</h2>
          <p className="text-gray-700 leading-relaxed">
            本サービスに関する知的財産権は、全て当社または当社にライセンスを許諾している者に帰属します。ユーザーは、本サービスの利用に必要な範囲でのみ、これらを使用することができます。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第7条（免責事項）</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>当社は、本サービスの内容変更、中断、終了により生じたいかなる損害についても責任を負いません。</li>
            <li>当社は、ユーザー間のトラブルについて一切の責任を負いません。</li>
            <li>当社は、本サービスの正確性、完全性、有用性等について保証しません。</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第8条（規約の変更）</h2>
          <p className="text-gray-700 leading-relaxed">
            当社は、必要に応じて本規約を変更することができます。変更後の規約は、本サービス上で通知した時点から効力を生じるものとします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">第9条（準拠法および管轄裁判所）</h2>
          <p className="text-gray-700 leading-relaxed">
            本規約は日本法に準拠し、本規約に関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </section>
      </div>
    </>
  );
};

const PrivacyContent: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-gray-500 mb-8">
        最終更新日: 2024年1月1日 | 施行日: 2024年1月1日
      </p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. 基本方針</h2>
          <p className="text-gray-700 leading-relaxed">
            株式会社InfluenceLink（以下「当社」といいます）は、インフルエンサーマーケティングプラットフォーム「InfluenceLink」（以下「本サービス」といいます）を提供するにあたり、ユーザーの個人情報保護の重要性を認識し、個人情報の保護に関する法律（個人情報保護法）その他関係法令を遵守し、適切な取り扱いを行います。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. 個人情報の定義</h2>
          <p className="text-gray-700 leading-relaxed">
            本プライバシーポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項に定義される、生存する個人に関する情報であって、特定の個人を識別することができるもの（他の情報と容易に照合することができ、それにより特定の個人を識別することができることとなるものを含む）を指します。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. 取得する個人情報</h2>
          <p className="text-gray-700 leading-relaxed mb-3">当社は、以下の個人情報を取得します：</p>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.1 登録時に取得する情報</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>氏名・会社名</li>
              <li>メールアドレス</li>
              <li>電話番号</li>
              <li>住所</li>
              <li>生年月日</li>
              <li>性別</li>
              <li>職業・業種</li>
              <li>SNSアカウント情報</li>
              <li>銀行口座情報（インフルエンサーユーザーの場合）</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.2 サービス利用時に取得する情報</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>ログイン履歴・アクセス履歴</li>
              <li>IPアドレス</li>
              <li>ブラウザ情報</li>
              <li>デバイス情報</li>
              <li>サービス利用状況</li>
              <li>チャットでのやり取り内容</li>
              <li>投稿されたコンテンツ</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">3.3 決済時に取得する情報</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>クレジットカード情報（カード番号は取得せず、決済代行業者で管理）</li>
              <li>請求先住所</li>
              <li>取引履歴</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. 個人情報の利用目的</h2>
          <p className="text-gray-700 leading-relaxed mb-3">当社は、取得した個人情報を以下の目的で利用します：</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>本サービスの提供・運営</li>
            <li>ユーザー認証・本人確認</li>
            <li>マッチング機能の提供</li>
            <li>決済処理・料金請求</li>
            <li>カスタマーサポートの提供</li>
            <li>サービス改善・新機能開発</li>
            <li>マーケティング・広告配信</li>
            <li>不正利用の検知・防止</li>
            <li>法令に基づく対応</li>
            <li>その他、本サービスの適切な運営に必要な業務</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. 個人情報の第三者提供</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません：
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. 個人情報の委託</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            当社は、利用目的の達成に必要な範囲において、個人情報の取り扱いを外部に委託する場合があります。この場合、委託先の選定を適切に行い、委託契約等において個人情報の適切な取り扱いを定め、適切な管理を行います。
          </p>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">主な委託先</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>クラウドサービス提供事業者（AWS、Google Cloud等）</li>
              <li>決済代行事業者</li>
              <li>メール配信サービス提供事業者</li>
              <li>カスタマーサポートツール提供事業者</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookieの使用</h2>
          <p className="text-gray-700 leading-relaxed">
            本サービスでは、ユーザーの利便性向上およびサービス改善のため、Cookie及び類似の技術を使用しています。Cookieの設定は、ブラウザの設定により無効にすることが可能ですが、一部機能が制限される場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. 個人情報の保管期間</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            当社は、利用目的の達成に必要な期間、法令等で定められた期間、または正当な事業上の目的のために必要な期間に限り、個人情報を保管します。
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>アカウント情報：アカウント削除から1年間</li>
            <li>取引関連情報：取引完了から7年間（法令に基づく）</li>
            <li>問い合わせ履歴：問い合わせから3年間</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. セキュリティ対策</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            当社は、個人情報の漏えい、滅失、毀損の防止その他個人情報の安全管理のため、必要かつ適切な措置を講じています：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>SSL/TLSによる通信の暗号化</li>
            <li>ファイアウォールによる不正アクセス防止</li>
            <li>定期的なセキュリティ監査の実施</li>
            <li>従業員への個人情報保護教育</li>
            <li>アクセス制御による管理</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. ユーザーの権利</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            ユーザーは、当社が保有する自己の個人情報について、以下の権利を有します：
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>開示請求権：個人情報の利用目的や第三者提供の状況等の開示を求める権利</li>
            <li>訂正・削除権：個人情報の訂正、追加、削除を求める権利</li>
            <li>利用停止権：個人情報の利用の停止を求める権利</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-3">
            これらの権利を行使される場合は、本人確認の上、合理的な期間内に対応いたします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. 18歳未満の個人情報</h2>
          <p className="text-gray-700 leading-relaxed">
            本サービスは18歳未満の方のご利用をお断りしており、18歳未満の方の個人情報を意図的に収集することはありません。万が一、18歳未満の方の個人情報を収集していることが判明した場合は、速やかに削除いたします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. プライバシーポリシーの変更</h2>
          <p className="text-gray-700 leading-relaxed">
            当社は、法令の変更や事業内容の変更に伴い、本プライバシーポリシーを変更する場合があります。重要な変更については、本サービス上での通知またはメールにてお知らせいたします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">13. 個人情報保護管理者</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            当社における個人情報保護管理者は以下のとおりです：
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              個人情報保護管理者：代表取締役<br />
              連絡先：privacy@influencelink.co.jp
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">14. お問い合わせ</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください：
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">
              株式会社InfluenceLink<br />
              個人情報保護担当<br />
              〒150-0001 東京都渋谷区神宮前1-1-1<br />
              メール: privacy@influencelink.co.jp<br />
              電話: 03-1234-5678（平日10:00-18:00）
            </p>
          </div>
        </section>
      </div>
    </>
  );
};
