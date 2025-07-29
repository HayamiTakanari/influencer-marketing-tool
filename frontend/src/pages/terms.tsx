import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';

const TermsPage: React.FC = () => {
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
      title="利用規約"
      subtitle="InfluenceLinkサービス利用規約"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第1条（総則）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  本利用規約（以下「本規約」といいます）は、株式会社InfluenceLink（以下「当社」といいます）が提供するインフルエンサーマーケティングプラットフォーム「InfluenceLink」（以下「本サービス」といいます）の利用条件を定めるものです。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  本サービスをご利用になる場合には、本規約の全ての条項に同意していただく必要があります。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第2条（定義）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">本規約において使用する用語の定義は以下のとおりです：</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>「ユーザー」とは、本サービスを利用する全ての個人・法人を指します</li>
                  <li>「企業ユーザー」とは、マーケティング活動を目的として本サービスを利用する法人を指します</li>
                  <li>「インフルエンサー」とは、SNS等での影響力を活用してマーケティング活動を行う個人・法人を指します</li>
                  <li>「プロジェクト」とは、本サービス上で実施されるマーケティング案件を指します</li>
                  <li>「コンテンツ」とは、本サービス上に投稿・アップロードされる全ての情報を指します</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第3条（アカウント登録）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  1. 本サービスの利用には、当社の定める方法によるアカウント登録が必要です。
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  2. 登録時に提供される情報は、正確かつ最新のものである必要があります。
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  3. 18歳未満の方は本サービスをご利用いただけません。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  4. 1つのメールアドレスにつき、1つのアカウントのみ作成可能です。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第4条（サービス内容）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  1. 本サービスは、企業ユーザーとインフルエンサーを結び付けるマッチングプラットフォームを提供します。
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  2. 当社は、マッチング機会の提供、チャット機能、決済代行サービス等を提供しますが、実際の契約内容については当事者間で決定していただきます。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  3. 当社は、サービス内容を予告なく変更・追加・削除することがあります。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第5条（利用料金）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  1. 基本的なアカウント登録・サービス利用は無料です。
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  2. プロジェクト成約時には、プロジェクト金額の10%（税別）を手数料として申し受けます。
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  3. 支払方法は、クレジットカード、銀行振込等、当社の定める方法に限ります。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  4. 一度お支払いいただいた料金の返金は、当社に重大な過失がある場合を除き、原則として行いません。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第6条（禁止事項）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">ユーザーは、以下の行為を行ってはなりません：</p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>法令、本規約、公序良俗に反する行為</li>
                  <li>虚偽の情報を登録・提供する行為</li>
                  <li>他のユーザーに迷惑をかける行為</li>
                  <li>本サービスの運営を妨害する行為</li>
                  <li>知的財産権を侵害する行為</li>
                  <li>本サービスを通じて営利目的以外の勧誘活動を行う行為</li>
                  <li>本サービス外での直接取引を意図的に行う行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第7条（知的財産権）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  1. 本サービスに関する知的財産権は、当社または正当な権利を有する第三者に帰属します。
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  2. ユーザーが本サービスに投稿したコンテンツの著作権は、投稿者に帰属します。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  3. 前項にかかわらず、ユーザーは当社に対し、サービス運営に必要な範囲でコンテンツを使用する権利を許諾するものとします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第8条（プライバシー）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  個人情報の取り扱いについては、別途定める「プライバシーポリシー」に従います。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第9条（サービスの中断・停止）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  当社は、以下の場合にサービスの全部または一部を中断・停止することがあります：
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>システムメンテナンスを行う場合</li>
                  <li>天災等の不可抗力により運営が困難な場合</li>
                  <li>その他、当社が必要と判断した場合</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第10条（アカウント停止・削除）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  当社は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止・削除することがあります。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第11条（免責事項）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  1. 当社は、本サービスに関して、明示・黙示を問わず一切の保証を行いません。
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  2. ユーザー間でのトラブルについて、当社は一切の責任を負いません。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  3. 当社の責任は、損害の発生原因が当社の故意または重過失による場合を除き、直接損害に限定され、かつ、損害発生の直前1か月間にユーザーが当社に支払った利用料金を上限とします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第12条（規約の変更）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  当社は、必要に応じて本規約を変更することがあります。変更後の規約は、本サービス上での掲載をもって効力を生じるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">第13条（準拠法・管轄裁判所）</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  1. 本規約は日本法に準拠し、日本法に従って解釈されます。
                </p>
                <p className="text-gray-700 leading-relaxed">
                  2. 本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">お問い合わせ</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  本規約に関するお問い合わせは、以下までご連絡ください：
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    株式会社InfluenceLink<br />
                    〒150-0001 東京都渋谷区神宮前1-1-1<br />
                    メール: legal@influencelink.co.jp<br />
                    電話: 03-1234-5678
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

export default TermsPage;