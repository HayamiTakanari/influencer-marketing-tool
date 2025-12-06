import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import { getFAQs } from '../services/api';

interface FAQItem {
  id: string;
  category: '基本的な使い方' | 'プロジェクト関連' | '支払い・請求' | 'アカウント・設定' | 'トラブルシューティング';
  question: string;
  answer: string;
  isOpen?: boolean;
}

const FAQPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const router = useRouter();

  const categories = [
    { value: 'all', label: 'すべて', icon: '📚' },
    { value: '基本的な使い方', label: '基本的な使い方', icon: '🔰' },
    { value: 'プロジェクト関連', label: 'プロジェクト関連', icon: '📝' },
    { value: '支払い・請求', label: '支払い・請求', icon: '💰' },
    { value: 'アカウント・設定', label: 'アカウント・設定', icon: '⚙️' },
    { value: 'トラブルシューティング', label: 'トラブルシューティング', icon: '🔧' }
  ];

  useEffect(() => {
    const loadData = async () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

      try {
        const faqData = await getFAQs();
        setFaqs(faqData.map((faq: any) => ({ ...faq, isOpen: false })));
      } catch (error) {
        console.error('Error loading FAQs:', error);
        setFaqs([]);
      }
    };

    loadData();
  }, []);

  // Fallback FAQs for when API is unavailable
  const fallbackFAQs: FAQItem[] = [
    {
      id: '1',
      category: '基本的な使い方',
      question: 'InfluenceLinkとは何ですか？',
      answer: 'InfluenceLinkは、企業とインフルエンサーを繋ぐマーケティングプラットフォームです。企業は効率的にインフルエンサーを見つけることができ、インフルエンサーは新しいビジネス機会を発見できます。'
    },
    {
      id: '2',
      category: '基本的な使い方',
      question: '登録に費用はかかりますか？',
      answer: '基本的な登録は無料です。ただし、プロジェクトの成約時には手数料が発生します。詳細は料金体系をご確認ください。'
    },
    {
      id: '3',
      category: '基本的な使い方',
      question: 'どのような人が利用できますか？',
      answer: '18歳以上の個人・法人が利用可能です。企業側は法人登録、インフルエンサー側は個人または法人での登録ができます。'
    },
    {
      id: '4',
      category: 'プロジェクト関連',
      question: 'プロジェクトの作成方法を教えてください',
      answer: 'ダッシュボードから「プロジェクト作成」をクリックし、必要な情報（予算、ターゲット、内容など）を入力してください。承認後、インフルエンサーからの応募を受け付けます。'
    },
    {
      id: '5',
      category: 'プロジェクト関連',
      question: 'インフルエンサーとのやり取りはどのように行いますか？',
      answer: 'プラットフォーム内のチャット機能を使用してコミュニケーションを取ります。契約から納品まで、すべてのやり取りが記録されるため安心です。'
    },
    {
      id: '6',
      category: 'プロジェクト関連',
      question: 'プロジェクトをキャンセルできますか？',
      answer: 'プロジェクトの進行状況によってキャンセルポリシーが異なります。マッチング前であれば無料、作業開始後はキャンセル料が発生する場合があります。'
    },
    {
      id: '7',
      category: '支払い・請求',
      question: '支払い方法は何がありますか？',
      answer: 'クレジットカード（Visa、MasterCard、JCB）、銀行振込に対応しています。法人のお客様は請求書払いも可能です。'
    },
    {
      id: '8',
      category: '支払い・請求',
      question: 'インボイス制度に対応していますか？',
      answer: 'はい、適格請求書発行事業者として登録済みです。インフルエンサーの方もインボイス情報の登録が必要です。'
    },
    {
      id: '9',
      category: '支払い・請求',
      question: '手数料はいくらですか？',
      answer: 'プロジェクト金額の10%（税別）を手数料として頂戴しております。支払いは成果報酬型のため、成約時のみ発生します。'
    },
    {
      id: '10',
      category: 'アカウント・設定',
      question: 'パスワードを忘れました',
      answer: 'ログイン画面の「パスワードを忘れた方」から再設定できます。登録されたメールアドレスに再設定用のリンクが送信されます。'
    },
    {
      id: '11',
      category: 'アカウント・設定',
      question: 'プロフィール情報を変更するには？',
      answer: 'ダッシュボードの「プロフィール編集」から変更可能です。重要な情報の変更時は本人確認が必要な場合があります。'
    },
    {
      id: '12',
      category: 'アカウント・設定',
      question: 'アカウントを削除できますか？',
      answer: '設定画面からアカウント削除が可能です。ただし、進行中のプロジェクトがある場合は完了後の削除となります。'
    },

    // トラブルシューティング
    {
      id: '13',
      category: 'トラブルシューティング',
      question: 'ログインできません',
      answer: 'メールアドレスとパスワードを確認してください。それでも解決しない場合は、ブラウザのキャッシュを削除するか、別のブラウザをお試しください。'
    },
    {
      id: '14',
      category: 'トラブルシューティング',
      question: 'チャット機能が使えません',
      answer: 'ブラウザの設定でJavaScriptが無効になっている可能性があります。また、NDAへの同意とインボイス情報の登録が必要です。'
    },
    {
      id: '15',
      category: 'トラブルシューティング',
      question: '動画のアップロードができません',
      answer: 'ファイルサイズが100MBを超えていないか確認してください。対応形式はMP4、MOV、AVIです。それでも解決しない場合はサポートまでお問い合わせください。'
    }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setFaqs(prev => prev.map(faq => 
      faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq
    ));
  };

  return (
    <DashboardLayout
      title="よくある質問"
      subtitle="InfluenceLinkの使い方や機能について"
    >
      <div>
        <Card className="mb-8" padding="lg">
          <div className="space-y-4">
            {/* 検索バー */}
            <div>
              <input
                type="text"
                placeholder="質問内容を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* カテゴリーフィルター */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                    selectedCategory === category.value
                      ? 'bg-emerald-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span className="hidden sm:inline">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* FAQ一覧 */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <Card className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">該当する質問が見つかりません</h3>
              <p className="text-gray-600">
                検索条件を変更するか、サポートまでお問い合わせください。
              </p>
            </Card>
          ) : (
            filteredFAQs.map((faq) => (
              <div key={faq.id}>
                <Card padding="none" className="overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {categories.find(c => c.value === faq.category)?.icon}
                      </span>
                      <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                    </div>
                    <div className="text-gray-400 transition-transform" style={{ transform: faq.isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </div>
                  </button>
                  {faq.isOpen && (
                    <div className="overflow-hidden transition-all">
                      <div className="px-6 pb-4 pt-2 bg-gray-50 border-t">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                  )}
                </Card>
              </div>
            ))
          )}
        </div>

        <div className="mt-12">
          <Card className="text-center" padding="xl">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">解決できない問題がありますか？</h3>
            <p className="text-gray-600 mb-6">
              上記で解決できない場合は、お気軽にサポートチームまでお問い合わせください。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/feedback')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                お問い合わせ・ご要望
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FAQPage;