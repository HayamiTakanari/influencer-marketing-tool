import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';

const PrivacyPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <PageLayout
      title="プライバシーポリシー"
      subtitle="個人情報の取り扱いについて"
      userEmail={user?.email}
      onLogout={user ? handleLogout : undefined}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card padding="xl">
          <div className="prose prose-gray max-w-none">
            <div className="mb-8 text-sm text-gray-500">
              最終更新日: 2024年1月1日<br />
              施行日: 2024年1月1日
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 基本方針</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  株式会社InfluenceLink（以下「当社」といいます）は、インフルエンサーマーケティングプラットフォーム「InfluenceLink」（以下「本サービス」といいます）を提供するにあたり、ユーザーの個人情報保護の重要性を認識し、個人情報の保護に関する法律（個人情報保護法）その他関係法令を遵守し、適切な取り扱いを行います。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 個人情報の定義</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  本プライバシーポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項に定義される、生存する個人に関する情報であって、特定の個人を識別することができるもの（他の情報と容易に照合することができ、それにより特定の個人を識別することができることとなるものを含む）を指します。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 取得する個人情報</h2>
                <p className="text-gray-700 leading-relaxed mb-4">当社は、以下の個人情報を取得します：</p>
                
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 個人情報の利用目的</h2>
                <p className="text-gray-700 leading-relaxed mb-4">当社は、取得した個人情報を以下の目的で利用します：</p>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 個人情報の第三者提供</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 個人情報の委託</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookieの使用</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  本サービスでは、ユーザーの利便性向上およびサービス改善のため、Cookie及び類似の技術を使用しています。Cookieの設定は、ブラウザの設定により無効にすることが可能ですが、一部機能が制限される場合があります。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 個人情報の保管期間</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  当社は、利用目的の達成に必要な期間、法令等で定められた期間、または正当な事業上の目的のために必要な期間に限り、個人情報を保管します。
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>アカウント情報：アカウント削除から1年間</li>
                  <li>取引関連情報：取引完了から7年間（法令に基づく）</li>
                  <li>問い合わせ履歴：問い合わせから3年間</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. セキュリティ対策</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. ユーザーの権利</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  ユーザーは、当社が保有する自己の個人情報について、以下の権利を有します：
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>開示請求権：個人情報の利用目的や第三者提供の状況等の開示を求める権利</li>
                  <li>訂正・削除権：個人情報の訂正、追加、削除を求める権利</li>
                  <li>利用停止権：個人情報の利用の停止を求める権利</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  これらの権利を行使される場合は、本人確認の上、合理的な期間内に対応いたします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. 18歳未満の個人情報</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  本サービスは18歳未満の方のご利用をお断りしており、18歳未満の方の個人情報を意図的に収集することはありません。万が一、18歳未満の方の個人情報を収集していることが判明した場合は、速やかに削除いたします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. プライバシーポリシーの変更</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  当社は、法令の変更や事業内容の変更に伴い、本プライバシーポリシーを変更する場合があります。重要な変更については、本サービス上での通知またはメールにてお知らせいたします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. 個人情報保護管理者</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">14. お問い合わせ</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
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
          </div>
        </Card>

        <div className="mt-8 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            ダッシュボードに戻る
          </motion.button>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default PrivacyPage;