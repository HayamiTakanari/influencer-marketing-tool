import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

interface FeedbackForm {
  type: 'feature_request' | 'bug_report' | 'improvement' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  email: string;
  allowContact: boolean;
}

const FeedbackPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<FeedbackForm>({
    type: 'feature_request',
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    email: '',
    allowContact: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const feedbackTypes = [
    { value: 'feature_request', label: '新機能のご要望', icon: '💡', description: '新しい機能の追加をご提案ください' },
    { value: 'bug_report', label: 'バグ報告', icon: '🐛', description: '不具合やエラーについてお知らせください' },
    { value: 'improvement', label: '既存機能の改善', icon: '⚡', description: '現在の機能をより使いやすくするご提案' },
    { value: 'other', label: 'その他', icon: '💬', description: 'サービス全般に関するご意見・ご要望' }
  ];

  const priorities = [
    { value: 'low', label: '低', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: '高', color: 'bg-red-100 text-red-800' }
  ];

  const categories = [
    'プロジェクト管理',
    'インフルエンサー検索',
    'チャット機能',
    'お支払い・請求',
    'プロフィール管理',
    'ダッシュボード',
    'モバイル対応',
    'パフォーマンス',
    'セキュリティ',
    'その他'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData(prev => ({
        ...prev,
        email: parsedUser.email || ''
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // フォームバリデーション
      if (!formData.title.trim()) {
        alert('タイトルを入力してください。');
        return;
      }
      if (!formData.description.trim()) {
        alert('詳細内容を入力してください。');
        return;
      }
      if (formData.description.length < 10) {
        alert('詳細内容は10文字以上で入力してください。');
        return;
      }

      // TODO: 実際のAPI呼び出し
      // const { submitFeedback } = await import('../services/api');
      // await submitFeedback(formData);

      // モック処理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Feedback submitted:', formData);
      setSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('送信に失敗しました。もう一度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <DashboardLayout
        title="ご要望・フィードバック"
        subtitle="送信完了"
      >
        <div>
          <Card className="text-center" padding="xl">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ご要望を送信いたしました
            </h2>
            <p className="text-gray-600 mb-6">
              貴重なご意見をありがとうございます。<br />
              内容を確認の上、改善に努めてまいります。
            </p>
            {formData.allowContact && (
              <p className="text-sm text-gray-500 mb-6">
                ご登録いただいたメールアドレスに、進捗状況をお知らせする場合があります。
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    type: 'feature_request',
                    title: '',
                    description: '',
                    priority: 'medium',
                    category: '',
                    email: user?.email || '',
                    allowContact: true
                  });
                }}
                variant="outline"
                size="lg"
              >
                別のご要望を送信
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="primary"
                size="lg"
              >
                ダッシュボードに戻る
              </Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="ご要望・フィードバック"
      subtitle="InfluenceLinkをより良いサービスにするためのご意見をお聞かせください"
    >
      <div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* フィードバックタイプ選択 */}
          <Card padding="lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📝 フィードバックの種類
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbackTypes.map(type => (
                <label
                  key={type.value}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="mt-1 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xl">{type.icon}</span>
                        <span className="font-semibold text-gray-900">{type.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          {/* 基本情報 */}
          <Card padding="lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📋 基本情報
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="簡潔なタイトルを入力してください"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    優先度
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    関連カテゴリー
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* 詳細内容 */}
          <Card padding="lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📝 詳細内容
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                内容の詳細 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={`${
                  formData.type === 'feature_request' ? '欲しい機能の詳細や使用場面について教えてください。'
                  : formData.type === 'bug_report' ? '発生した問題の詳細、再現手順、期待する動作について教えてください。'
                  : formData.type === 'improvement' ? '改善したい機能と、どのように改善されれば良いかを教えてください。'
                  : 'ご意見・ご要望の詳細を教えてください。'
                }`}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                required
              />
              <div className="text-right text-sm text-gray-500 mt-2">
                {formData.description.length}/2000文字
              </div>
            </div>
          </Card>

          {/* 連絡先情報 */}
          <Card padding="lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              📧 連絡先情報
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
                  readOnly={!!user}
                />
                {user && (
                  <p className="text-xs text-gray-500 mt-1">
                    ログイン中のアカウントのメールアドレスが自動設定されています
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.allowContact}
                    onChange={(e) => setFormData({ ...formData, allowContact: e.target.checked })}
                    className="mt-1 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium mb-1">
                      進捗状況の連絡を受け取る
                    </div>
                    <div className="text-gray-600">
                      ご要望の検討状況や実装完了時にメールでお知らせします
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </Card>

          {/* 送信ボタン */}
          <Card padding="lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="submit"
                disabled={submitting}
                loading={submitting}
                variant="primary"
                size="xl"
                className="flex-1"
              >
                送信する
              </Button>
              <Button
                type="button"
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="xl"
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              送信されたご要望は開発チームで確認し、サービス改善の参考にさせていただきます。
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default FeedbackPage;