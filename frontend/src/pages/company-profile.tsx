import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import Card from '../components/shared/Card';

interface CompanyProfile {
  id: string;
  companyName: string;
  industry: string;
  contactName: string;
  contactPhone: string;
  address: string;
  website?: string;
  description?: string;
  budget?: number;
  targetAudience?: string;
  location?: string;
  bankName?: string;
  branchName?: string;
  accountType?: string;
  accountNumber?: string;
  accountName?: string;
}

const CompanyProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactName: '',
    contactPhone: '',
    address: '',
    website: '',
    description: '',
    budget: 0,
    targetAudience: '',
    location: '',
    bankName: '',
    branchName: '',
    accountType: '',
    accountNumber: '',
    accountName: ''
  });

  const industries = [
    '美容・化粧品', 'ファッション', 'フード・飲料', 'テクノロジー', 'エンターテイメント',
    '旅行・観光', 'スポーツ・フィットネス', 'ライフスタイル', '自動車', '金融',
    '教育', 'ヘルスケア', '不動産', '小売', 'その他'
  ];

  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  const accountTypes = ['普通預金', '当座預金'];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      fetchProfile();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchProfile = async () => {
    try {
      const { getMyProfile } = await import('../services/api');
      const result = await getMyProfile();
      setProfile(result);
      
      if (result) {
        setFormData({
          companyName: result.companyName || '',
          industry: result.industry || '',
          contactName: result.contactName || '',
          contactPhone: result.contactPhone || '',
          address: result.address || '',
          website: result.website || '',
          description: result.description || '',
          budget: result.budget || 0,
          targetAudience: result.targetAudience || '',
          location: result.location || '',
          bankName: result.bankName || '',
          branchName: result.branchName || '',
          accountType: result.accountType || '',
          accountNumber: result.accountNumber || '',
          accountName: result.accountName || ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('プロフィールの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { updateProfile } = await import('../services/api');
      await updateProfile(formData);
      await fetchProfile();
      alert('プロフィールが更新されました！');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('プロフィールの更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <DashboardLayout title="企業プロフィール" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="企業プロフィール"
      subtitle="あなたの会社情報を管理しましょう"
    >
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Card>
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">🏢</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">{profile?.companyName || '会社名未設定'}</h2>
                  <p className="text-gray-600">{profile?.industry || '業界未設定'}</p>
                  <p className="text-gray-500 text-sm">担当者: {profile?.contactName || '未設定'}</p>
                </div>
              </div>

              {profile?.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">会社概要</h3>
                  <p className="text-gray-700">{profile.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {profile?.budget && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{formatPrice(profile.budget)}</div>
                    <div className="text-gray-600 text-sm">予算</div>
                  </div>
                )}
                {profile?.targetAudience && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile.targetAudience}</div>
                    <div className="text-gray-600 text-sm">ターゲット</div>
                  </div>
                )}
                {profile?.location && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{profile.location}</div>
                    <div className="text-gray-600 text-sm">所在地</div>
                  </div>
                )}
                <div className="text-center">
                  <div className={`text-2xl font-bold ${profile?.bankName ? 'text-green-600' : 'text-gray-400'}`}>
                    {profile?.bankName ? '✓' : '✗'}
                  </div>
                  <div className="text-gray-600 text-sm">口座情報</div>
                  {profile?.bankName && (
                    <div className="text-xs text-gray-500 mt-1">{profile.bankName}</div>
                  )}
                </div>
              </div>
        </Card>

        <Card>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">プロフィール編集</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">会社名</label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="株式会社〇〇"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">業界</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">選択してください</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">担当者名</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="山田太郎"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="03-1234-5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">選択してください</option>
                      {prefectures.map(prefecture => (
                        <option key={prefecture} value={prefecture}>{prefecture}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ウェブサイト</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">月間予算 (円)</label>
                    <input
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ターゲット層</label>
                    <input
                      type="text"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="20-30代女性"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">住所</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="東京都渋谷区..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">会社概要</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="会社の事業内容、サービス、企業理念などを記載してください..."
                  />
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🏦</span>
                    口座情報（支払い用）
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center">
                      <span className="text-yellow-600 mr-2">ℹ️</span>
                      <p className="text-sm text-yellow-800">
                        インフルエンサーへの報酬支払いに使用する口座情報を入力してください。この情報は安全に暗号化されて保存されます。
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">銀行名</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：三菱UFJ銀行"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">支店名</label>
                      <input
                        type="text"
                        value={formData.branchName}
                        onChange={(e) => setFormData({...formData, branchName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：渋谷支店"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">口座種別</label>
                      <select
                        value={formData.accountType}
                        onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">選択してください</option>
                        {accountTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">口座番号</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：1234567"
                        maxLength={8}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">口座名義</label>
                      <input
                        type="text"
                        value={formData.accountName}
                        onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例：カブシキガイシャ〇〇"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '保存中...' : 'プロフィールを保存'}
                </button>
              </form>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">💡 プロフィール完成度を上げるコツ</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>会社概要を詳しく記載することで、インフルエンサーにとって魅力的な企業として映ります</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>具体的な予算を設定することで、より適切なインフルエンサーとマッチングできます</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>ターゲット層を明確にすることで、効果的なキャンペーンが実現できます</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>ウェブサイトを登録することで、インフルエンサーが事前に企業研究できます</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>口座情報を登録することで、インフルエンサーへのスムーズな報酬支払いが可能になります</p>
                </div>
              </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CompanyProfilePage;