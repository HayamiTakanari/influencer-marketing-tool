import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';

const CommercialLawPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <DashboardLayout
      title="特定商取引法に基づく表記"
      subtitle="電子商取引に関する法的表記"
    >
      <div>
        <Card padding="xl">
          <div className="prose prose-gray max-w-none">
            <div className="mb-8 text-sm text-gray-500">
              特定商取引に関する法律第11条に基づく表記
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">販売業者</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    株式会社InfluenceLink
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">販売責任者</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    代表取締役 田中 太郎
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">所在地</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    〒150-0001<br />
                    東京都渋谷区神宮前1丁目1番1号<br />
                    InfluenceLinkビル 5階
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">連絡先</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    電話番号：03-1234-5678<br />
                    FAX番号：03-1234-5679<br />
                    メールアドレス：info@influencelink.co.jp
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    ※お問い合わせ受付時間：平日10:00～18:00（土日祝日除く）
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">商品・サービス</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    インフルエンサーマーケティングプラットフォーム「InfluenceLink」の提供<br />
                    マッチングサービス手数料
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">料金</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">基本利用料</h3>
                      <p className="text-gray-700">無料</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">成約手数料</h3>
                      <p className="text-gray-700">プロジェクト金額の10%（税別）</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">決済手数料</h3>
                      <p className="text-gray-700">決済金額の3.6%（税別）</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">料金の支払い方法</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>クレジットカード決済（Visa、MasterCard、JCB、American Express、Diners Club）</li>
                    <li>銀行振込</li>
                    <li>請求書払い（法人のみ）</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    ※銀行振込の場合、振込手数料はお客様負担となります。
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">料金の支払い時期</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>成約手数料：プロジェクト成約時</li>
                    <li>決済手数料：決済処理時</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-3">
                    ※クレジットカード決済の場合は、各カード会社の規定に基づく引き落としとなります。
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">サービス提供時期</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    お申込み完了後、即時サービス提供開始<br />
                    ※システムメンテナンス等により一時的に利用できない場合があります。
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">返品・交換・キャンセル</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">基本方針</h3>
                      <p className="text-gray-700">
                        デジタルサービスの性質上、原則として返品・返金は承っておりません。
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">例外的な返金対応</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>当社のシステム障害により継続的にサービスが利用できない場合</li>
                        <li>当社の重大な過失によりサービス提供ができない場合</li>
                        <li>法的に返金が義務付けられている場合</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">プロジェクトのキャンセル</h3>
                      <p className="text-gray-700">
                        プロジェクトの進行状況に応じてキャンセルポリシーが適用されます。<br />
                        詳細は利用規約をご確認ください。
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">動作環境</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">推奨ブラウザ</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>Google Chrome（最新版）</li>
                        <li>Mozilla Firefox（最新版）</li>
                        <li>Safari（最新版）</li>
                        <li>Microsoft Edge（最新版）</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">必要な設定</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>JavaScript有効</li>
                        <li>Cookie有効</li>
                        <li>SSL/TLS対応</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">個人情報の取り扱い</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">
                    お客様の個人情報については、別途定める「プライバシーポリシー」に従って適切に取り扱います。<br />
                    個人情報保護の詳細については、プライバシーポリシーをご確認ください。
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => router.push('/privacy')}
                      className="text-emerald-600 hover:text-emerald-700 underline transition-colors"
                    >
                      プライバシーポリシーを確認する →
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">事業者登録番号</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-semibold">法人番号：</span>1234567890123
                    </p>
                    <p className="text-gray-700">
                      <span className="font-semibold">適格請求書発行事業者登録番号：</span>T1234567890123
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">その他</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>本サービスの利用には、別途定める利用規約への同意が必要です</li>
                    <li>表記内容は予告なく変更する場合があります</li>
                    <li>本表記に関するお問い合わせは、上記連絡先までご連絡ください</li>
                  </ul>
                  <div className="mt-4">
                    <button
                      onClick={() => router.push('/terms')}
                      className="text-emerald-600 hover:text-emerald-700 underline mr-4 transition-colors"
                    >
                      利用規約を確認する →
                    </button>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">苦情・相談窓口</h2>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">当社窓口</h3>
                      <p className="text-gray-700">
                        メール：support@influencelink.co.jp<br />
                        電話：03-1234-5678（平日10:00～18:00）
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">外部相談窓口</h3>
                      <p className="text-gray-700">
                        消費者ホットライン：188（いやや！）<br />
                        国民生活センター：https://www.kokusen.go.jp/
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommercialLawPage;