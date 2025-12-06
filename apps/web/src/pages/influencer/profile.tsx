import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaTiktok, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingState from '../../components/common/LoadingState';
import ProfileCompletionCard from '../../components/common/ProfileCompletionCard';
import TikTokAuthButton from '../../components/sns/TikTokAuthButton';
import { validateInfluencerInvoiceInfo } from '../../utils/invoiceValidation';
import { WorkingStatus, Platform } from '../../types';
import api from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  profileUrl: string;
  followerCount: number;
  engagementRate: number;
  isVerified: boolean;
  isConnected?: boolean;
  lastSynced?: string;
}

interface Portfolio {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  platform: string;
}

interface ProfileData {
  id: string;
  displayName: string;
  bio: string;
  categories: string[];
  prefecture: string;
  city: string;
  priceMin: number;
  priceMax: number;
  gender: string;
  birthDate: string;
  phoneNumber: string;
  address: string;
  isRegistered: boolean;
  socialAccounts: SocialAccount[];
  portfolio: Portfolio[];
  workingStatus?: WorkingStatus;
  workingStatusMessage?: string;
  workingStatusUpdatedAt?: string;
  user?: {
    id: string;
    email: string;
    profileImage?: string;
  };
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'social' | 'portfolio' | 'invoice' | 'working'>('basic');
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [oauthConnectionStatus, setOauthConnectionStatus] = useState<any[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();

  // URL query parameter から activeTab を更新
  useEffect(() => {
    if (router.isReady) {
      const tabParam = router.query.tab as string;
      if (tabParam && ['basic', 'social', 'portfolio', 'invoice', 'working'].includes(tabParam)) {
        setActiveTab(tabParam as 'basic' | 'social' | 'portfolio' | 'invoice' | 'working');
      }
    }
  }, [router.isReady, router.query.tab]);

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    categories: [] as string[],
    prefecture: '',
    city: '',
    priceMin: 0,
    priceMax: 0,
    gender: '',
    phoneNumber: '',
    address: ''
  });

  const [socialFormData, setSocialFormData] = useState({
    platform: '',
    username: '',
    profileUrl: '',
    followerCount: 0,
    engagementRate: 0,
    isVerified: false
  });

  const [portfolioFormData, setPortfolioFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    platform: ''
  });

  const [invoiceFormData, setInvoiceFormData] = useState({
    companyName: '',
    registrationNumber: '',
    postalCode: '',
    address: '',
    phoneNumber: '',
    bankName: '',
    branchName: '',
    accountType: '普通',
    accountNumber: '',
    accountName: ''
  });

  const [workingFormData, setWorkingFormData] = useState({
    workingStatus: WorkingStatus.AVAILABLE,
    workingStatusMessage: ''
  });

  const categories = [
    '美容', 'ファッション', 'ライフスタイル', '料理', '旅行', 
    'フィットネス', 'テクノロジー', 'エンタメ', 'ビジネス', 'その他'
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

  const platforms = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER'];

  const workingStatusOptions = [
    { value: WorkingStatus.AVAILABLE, label: '対応可能', color: 'bg-green-100 text-green-800', icon: '✅' },
    { value: WorkingStatus.BUSY, label: '多忙', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
    { value: WorkingStatus.UNAVAILABLE, label: '対応不可', color: 'bg-red-100 text-red-800', icon: '❌' },
    { value: WorkingStatus.BREAK, label: '休暇中', color: 'bg-blue-100 text-blue-800', icon: '🏖️' }
  ];

  const getWorkingStatusInfo = (status: WorkingStatus) => {
    return workingStatusOptions.find(option => option.value === status) || workingStatusOptions[0];
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // インフルエンサーのみアクセス可能
      if (parsedUser.role !== 'INFLUENCER') {
        router.push('/dashboard');
        return;
      }
      
      // URLパラメータでタブを切り替え
      const { tab } = router.query;
      if (tab && ['basic', 'social', 'portfolio', 'invoice', 'working'].includes(tab as string)) {
        setActiveTab(tab as 'basic' | 'social' | 'portfolio' | 'invoice' | 'working');
      }
      
      fetchProfile();
    } else {
      router.push('/login');
    }
  }, [router, router.query]);


  const fetchProfile = async () => {
    try {
      const { getMyProfile } = await import('../../services/api');
      const result = await getMyProfile();
      setProfile(result);

      // フォームデータを設定
      if (result) {
        setFormData({
          displayName: result.displayName || '',
          bio: result.bio || '',
          categories: result.categories || [],
          prefecture: result.prefecture || '',
          city: result.city || '',
          priceMin: result.priceMin || 0,
          priceMax: result.priceMax || 0,
          gender: result.gender || '',
          phoneNumber: result.phoneNumber || '',
          address: result.address || ''
        });

        setWorkingFormData({
          workingStatus: result.workingStatus || WorkingStatus.AVAILABLE,
          workingStatusMessage: result.workingStatusMessage || ''
        });
      }
    } catch (err: any) {
      handleError(err, 'プロフィールの取得');
      setError('プロフィールの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // OAuth連携状態を取得
  const fetchOAuthConnectionStatus = async () => {
    try {
      const response = await api.get('/oauth/status');
      setOauthConnectionStatus(response.data.connectionStatus || []);
    } catch (error) {
      handleError(error, 'OAuth状態の取得');
    }
  };

  // OAuth連携開始
  const handleOAuthConnect = async (platform: Platform) => {
    setConnecting(platform);
    setMessage(null);

    try {
      const response = await api.get(`/api/oauth/auth/${platform.toLowerCase()}`);
      
      if (response.data.authUrl) {
        // OAuth認証ページへリダイレクト
        window.location.href = response.data.authUrl;
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '認証の開始に失敗しました',
      });
      setConnecting(null);
    }
  };

  // OAuth連携解除
  const handleOAuthDisconnect = async (platform: Platform) => {
    if (!confirm(`${platform}の連携を解除してもよろしいですか？`)) {
      return;
    }

    try {
      await api.delete(`/api/oauth/disconnect/${platform.toLowerCase()}`);
      setMessage({
        type: 'success',
        text: `${platform}の連携を解除しました`,
      });
      fetchOAuthConnectionStatus();
      fetchProfile(); // プロファイルも再取得
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '連携解除に失敗しました',
      });
    }
  };

  // SNSプラットフォームのアイコンを取得
  const getSNSPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case Platform.INSTAGRAM:
        return <FaInstagram className="text-2xl" />;
      case Platform.YOUTUBE:
        return <FaYoutube className="text-2xl" />;
      case Platform.TIKTOK:
        return <FaTiktok className="text-2xl" />;
      case Platform.TWITTER:
        return <FaTwitter className="text-2xl" />;
      default:
        return null;
    }
  };

  // SNSプラットフォームの色を取得
  const getSNSPlatformColor = (platform: Platform) => {
    switch (platform) {
      case Platform.INSTAGRAM:
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case Platform.YOUTUBE:
        return 'bg-red-600';
      case Platform.TIKTOK:
        return 'bg-black';
      case Platform.TWITTER:
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { updateProfile } = await import('../../services/api');
      await updateProfile(formData);
      await fetchProfile();
      handleSuccess('プロフィールが更新されました！');
    } catch (err: any) {
      handleError(err, 'プロフィールの更新');
      setError('プロフィールの更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { addSocialAccount, updateSocialAccount } = await import('../../services/api');
      
      if (editingItem) {
        await updateSocialAccount(editingItem.id, socialFormData);
      } else {
        await addSocialAccount(socialFormData);
      }
      
      await fetchProfile();
      setShowSocialForm(false);
      setEditingItem(null);
      setSocialFormData({
        platform: '',
        username: '',
        profileUrl: '',
        followerCount: 0,
        engagementRate: 0,
        isVerified: false
      });
      handleSuccess('SNSアカウントが保存されました！');
    } catch (err: any) {
      handleError(err, 'SNSアカウントの保存');
      setError('SNSアカウントの保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { addPortfolio, updatePortfolio } = await import('../../services/api');
      
      if (editingItem) {
        await updatePortfolio(editingItem.id, portfolioFormData);
      } else {
        await addPortfolio(portfolioFormData);
      }
      
      await fetchProfile();
      setShowPortfolioForm(false);
      setEditingItem(null);
      setPortfolioFormData({
        title: '',
        description: '',
        imageUrl: '',
        link: '',
        platform: ''
      });
      handleSuccess('ポートフォリオが保存されました！');
    } catch (err: any) {
      handleError(err, 'ポートフォリオの保存');
      setError('ポートフォリオの保存に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleDeleteSocial = async (id: string) => {
    if (confirm('このSNSアカウントを削除しますか？')) {
      try {
        const { deleteSocialAccount } = await import('../../services/api');
        await deleteSocialAccount(id);
        await fetchProfile();
        handleSuccess('SNSアカウントが削除されました');
      } catch (err) {
        handleError(err, 'SNSアカウントの削除');
        setError('SNSアカウントの削除に失敗しました。');
      }
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (confirm('このポートフォリオを削除しますか？')) {
      try {
        const { deletePortfolio } = await import('../../services/api');
        await deletePortfolio(id);
        await fetchProfile();
        handleSuccess('ポートフォリオが削除されました');
      } catch (err) {
        handleError(err, 'ポートフォリオの削除');
        setError('ポートフォリオの削除に失敗しました。');
      }
    }
  };

  const handleSyncSocialAccount = async (accountId: string) => {
    setSyncingAccountId(accountId);
    
    try {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api'}/sns/sync/${accountId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await fetchProfile();
          alert('SNSアカウントの同期が完了しました！');
          return;
        }
      } catch (apiError) {
        console.warn('API not available for sync:', apiError);
        setError('SNSアカウントの同期に失敗しました。');
      }
      
    } catch (err: any) {
      handleError(err, 'SNSアカウントの同期');
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleSyncAllAccounts = async () => {
    setSyncing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000/api'}/sns/sync-all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          await fetchProfile();
          alert(`全てのSNSアカウントの同期が完了しました！\n成功: ${result.successful || 0}件\n失敗: ${result.failed || 0}件`);
          return;
        }
      } catch (apiError) {
        console.warn('API not available for sync-all:', apiError);
        setError('全てのSNSアカウントの同期に失敗しました。');
      }
      
    } catch (err: any) {
      handleError(err, 'SNSアカウントの一括同期');
    } finally {
      setSyncing(false);
    }
  };

  const handleWorkingStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      // TODO: 実際のAPI呼び出しで稼働状況を更新
      // const { updateWorkingStatus } = await import('../services/api');
      // await updateWorkingStatus(workingFormData);
      
      // モック処理
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // プロフィール情報を更新
      if (profile) {
        const updatedProfile = {
          ...profile,
          workingStatus: workingFormData.workingStatus,
          workingStatusMessage: workingFormData.workingStatusMessage,
          workingStatusUpdatedAt: new Date().toISOString()
        };
        setProfile(updatedProfile);
        
        // ローカルストレージのユーザー情報も更新
        if (user) {
          const updatedUser = {
            ...user,
            workingStatus: workingFormData.workingStatus,
            workingStatusMessage: workingFormData.workingStatusMessage,
            workingStatusUpdatedAt: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
      
      handleSuccess('稼働状況を更新しました！');
    } catch (err: any) {
      handleError(err, '稼働状況の更新');
      setError('稼働状況の更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      // フォームデータの検証
      const requiredFields = ['companyName', 'address', 'phoneNumber', 'bankName', 'branchName', 'accountNumber', 'accountName'];
      const missingFields = requiredFields.filter(field => !invoiceFormData[field as keyof typeof invoiceFormData]?.toString().trim());
      
      if (missingFields.length > 0) {
        alert('以下の必須項目を入力してください。');
        return;
      }
      
      // TODO: 実際のAPI呼び出しでインボイス情報を保存
      // const { updateInvoiceInfo } = await import('../services/api');
      // await updateInvoiceInfo(invoiceFormData);
      
      // モック処理
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ユーザー情報を更新
      const updatedUser = {
        ...user,
        hasInvoiceInfo: true,
        invoiceInfo: {
          companyName: invoiceFormData.companyName,
          registrationNumber: invoiceFormData.registrationNumber,
          postalCode: invoiceFormData.postalCode,
          address: invoiceFormData.address,
          phoneNumber: invoiceFormData.phoneNumber,
          bankInfo: {
            bankName: invoiceFormData.bankName,
            branchName: invoiceFormData.branchName,
            accountType: invoiceFormData.accountType,
            accountNumber: invoiceFormData.accountNumber,
            accountName: invoiceFormData.accountName
          }
        }
      };
      
      // localStorageとstateを更新
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      handleSuccess('インボイス情報が正常に保存されました');
      
    } catch (err: any) {
      handleError(err, 'インボイス情報の保存');
      setError('インボイス情報の保存に失敗しました。');
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

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸';
      case 'youtube': return '🎥';
      case 'tiktok': return '🎵';
      case 'twitter': return '🐦';
      default: return '📱';
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="プロフィール管理" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="プロフィール管理"
      subtitle="あなたの情報を管理しましょう"
    >
      <div className="space-y-4">
        {user?.role === 'INFLUENCER' && (
          <ProfileCompletionCard />
        )}
        
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => router.push('/influencer/profile?tab=basic')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              基本情報
            </button>
            <button
              onClick={() => router.push('/influencer/profile?tab=social')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'social'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              SNS
            </button>
            <button
              onClick={() => router.push('/influencer/profile?tab=portfolio')}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === 'portfolio'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              実績
            </button>
            {user?.role === 'INFLUENCER' && (
              <>
                <button
                  onClick={() => router.push('/influencer/profile?tab=invoice')}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'invoice'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  請求先
                </button>
                <button
                  onClick={() => router.push('/influencer/profile?tab=working')}
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === 'working'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  稼働状況
                </button>
              </>
            )}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div
          >
            <Card className="bg-red-50 border-red-200">
              <div className="text-red-700">
                {error}
              </div>
            </Card>
          </div>
        )}

        {/* 基本情報 */}
        {activeTab === 'basic' && (
          <div
          >
            <Card>
              <h2 className="text-xl font-bold text-gray-900 mb-4">基本情報</h2>
              
              <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
              {/* プロフィール画像 */}
              <div className="flex items-center space-x-4 pb-4 border-b border-gray-200">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {profile?.user?.profileImage || user?.profileImage ? (
                    <img 
                      src={profile?.user?.profileImage || user?.profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロフィール画像
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const formData = new FormData();
                          formData.append('image', file);
                          
                          const token = localStorage.getItem('token');
                          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/upload/profile-image`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`
                            },
                            body: formData
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to upload image');
                          }
                          
                          const data = await response.json();
                          const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${data.imageUrl}`;
                          
                          const updatedUser = { ...user, profileImage: imageUrl };
                          setUser(updatedUser);
                          localStorage.setItem('user', JSON.stringify(updatedUser));
                        } catch (error) {
                          handleError(error, '画像のアップロード');
                        }
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF（最大5MB）</p>
                </div>
              </div>

              {/* アカウント情報 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">アカウント情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      onChange={(e) => {
                        const updatedUser = { ...user, email: e.target.value };
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーID</label>
                    <input
                      type="text"
                      value={user?.id || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ロール</label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">表示名</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="田中美咲"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
                  <select
                    value={formData.prefecture}
                    onChange={(e) => setFormData({...formData, prefecture: e.target.value})}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {prefectures.map(prefecture => (
                      <option key={prefecture} value={prefecture}>{prefecture}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="渋谷区"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">性別</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    <option value="MALE">男性</option>
                    <option value="FEMALE">女性</option>
                    <option value="OTHER">その他</option>
                    <option value="NOT_SPECIFIED">未指定</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="090-1234-5678"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">住所</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="東京都渋谷区..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="あなたの活動内容や得意分野について教えてください..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategoryToggle(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        formData.categories.includes(category)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最低料金 (円)</label>
                  <input
                    type="number"
                    value={formData.priceMin || ''}
                    onChange={(e) => setFormData({...formData, priceMin: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">最高料金 (円)</label>
                  <input
                    type="number"
                    value={formData.priceMax || ''}
                    onChange={(e) => setFormData({...formData, priceMax: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="200000"
                  />
                </div>
              </div>

                <Button
                  type="submit"
                  disabled={saving}
                  loading={saving}
                  size="xl"
                  className="w-full"
                >
                  基本情報を保存
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* SNSアカウントタブ */}
        {activeTab === 'social' && (
          <div
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">SNSアカウント</h2>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleSyncAllAccounts}
                    disabled={syncing}
                    loading={syncing}
                    variant="secondary"
                    icon="🔄"
                  >
                    全て同期
                  </Button>
                  <Button
                    onClick={() => setShowSocialForm(true)}
                    icon="+"
                  >
                    追加
                  </Button>
                </div>
              </div>


              {/* TikTok 認証セクション */}
              <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">SNS認証（TikTok）</h3>
                <p className="text-gray-600 text-sm mb-4">
                  TikTokアカウントを認証して、あなたのプロフィール情報を自動更新できます。
                </p>
                <TikTokAuthButton
                  onSuccess={(account) => {
                    handleSuccess(`TikTokアカウント @${account.username} が認証されました！`);
                    fetchProfile();
                  }}
                  onError={(error) => {
                    setMessage({
                      type: 'error',
                      text: error
                    });
                  }}
                />
              </div>

              {/* 既存のSNSアカウント */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">登録済みアカウント</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.socialAccounts?.map((account, index) => (
                  <div
                    key={account.id}
                  >
                    <Card padding="md" className="bg-gray-50"
                    >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{account.platform}</h3>
                        <p className="text-gray-600 text-sm">@{account.username}</p>
                      </div>
                    </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleSyncSocialAccount(account.id)}
                          disabled={syncingAccountId === account.id}
                          loading={syncingAccountId === account.id}
                          variant="ghost"
                          size="sm"
                        >
                          🔄 再同期
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingItem(account);
                            setSocialFormData(account);
                            setShowSocialForm(true);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          編集
                        </Button>
                        <Button
                          onClick={() => handleDeleteSocial(account.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </Button>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                    <div>
                      <span className="text-gray-500">フォロワー:</span>
                      <span className="font-semibold ml-1">{account.followerCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">エンゲージメント:</span>
                      <span className="font-semibold ml-1">{account.engagementRate}%</span>
                    </div>
                  </div>
                  
                  {account.lastSynced && (
                    <div className="text-xs text-gray-500">
                      最終同期: {new Date(account.lastSynced).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                  
                  {account.isVerified && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ 認証済み
                      </span>
                    </div>
                    )}
                    </Card>
                  </div>
                ))}
              </div>

              {(!profile?.socialAccounts || profile.socialAccounts.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📱</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">SNSアカウントがありません</h3>
                  <p className="text-gray-600 mb-4">SNSアカウントを追加して、より多くの企業にアピールしましょう。</p>
                  <Button
                    onClick={() => setShowSocialForm(true)}
                    size="lg"
                  >
                    最初のアカウントを追加
                  </Button>
                </div>
              )}
              </div>
            </Card>
          </div>
        )}

        {/* ポートフォリオタブ */}
        {activeTab === 'portfolio' && (
          <div
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">ポートフォリオ</h2>
                <Button
                  onClick={() => setShowPortfolioForm(true)}
                  icon="+"
                >
                  追加
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile?.portfolio?.map((item, index) => (
                  <div
                    key={item.id}
                  >
                    <Card padding="md" className="bg-gray-50">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      )}
                      <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => {
                              setEditingItem(item);
                              setPortfolioFormData(item);
                              setShowPortfolioForm(true);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            編集
                          </Button>
                          <Button
                            onClick={() => handleDeletePortfolio(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            削除
                          </Button>
                        </div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800 transition-colors text-sm font-medium"
                          >
                            詳細 →
                          </a>
                        )}
                      </div>
                    </Card>
                  </div>
              ))}
            </div>

              {(!profile?.portfolio || profile.portfolio.length === 0) && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">ポートフォリオがありません</h3>
                  <p className="text-gray-600 mb-4">これまでの作品や実績を追加して、あなたの魅力をアピールしましょう。</p>
                  <Button
                    onClick={() => setShowPortfolioForm(true)}
                    size="lg"
                  >
                    最初の作品を追加
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* SNSアカウントフォーム */}
      {showSocialForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full relative"
          >
            <button
              onClick={() => {
                setShowSocialForm(false);
                setEditingItem(null);
                setSocialFormData({
                  platform: '',
                  username: '',
                  profileUrl: '',
                  followerCount: 0,
                  engagementRate: 0,
                  isVerified: false
                });
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-center">
              {editingItem ? 'SNSアカウント編集' : 'SNSアカウント追加'}
            </h2>
            
            <form onSubmit={handleSocialSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プラットフォーム</label>
                <select
                  value={socialFormData.platform}
                  onChange={(e) => setSocialFormData({...socialFormData, platform: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
                <input
                  type="text"
                  value={socialFormData.username}
                  onChange={(e) => setSocialFormData({...socialFormData, username: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="your_username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プロフィールURL</label>
                <input
                  type="url"
                  value={socialFormData.profileUrl}
                  onChange={(e) => setSocialFormData({...socialFormData, profileUrl: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://instagram.com/your_username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">フォロワー数</label>
                <input
                  type="number"
                  value={socialFormData.followerCount || ''}
                  onChange={(e) => setSocialFormData({...socialFormData, followerCount: parseInt(e.target.value) || 0})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">エンゲージメント率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={socialFormData.engagementRate || ''}
                  onChange={(e) => setSocialFormData({...socialFormData, engagementRate: parseFloat(e.target.value) || 0})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="3.5"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={socialFormData.isVerified}
                  onChange={(e) => setSocialFormData({...socialFormData, isVerified: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                />
                <label htmlFor="isVerified" className="text-sm font-medium text-gray-700">
                  認証済みアカウント
                </label>
              </div>

              <Button
                type="submit"
                disabled={saving}
                loading={saving}
                size="xl"
                className="w-full"
              >
                {editingItem ? '更新' : '追加'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ポートフォリオフォーム */}
      {showPortfolioForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl p-8 max-w-md w-full relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setShowPortfolioForm(false);
                setEditingItem(null);
                setPortfolioFormData({
                  title: '',
                  description: '',
                  imageUrl: '',
                  link: '',
                  platform: ''
                });
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-center">
              {editingItem ? 'ポートフォリオ編集' : 'ポートフォリオ追加'}
            </h2>
            
            <form onSubmit={handlePortfolioSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                <input
                  type="text"
                  value={portfolioFormData.title}
                  onChange={(e) => setPortfolioFormData({...portfolioFormData, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="プロジェクトのタイトル"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={portfolioFormData.description}
                  onChange={(e) => setPortfolioFormData({...portfolioFormData, description: e.target.value})}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="プロジェクトの詳細な説明..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">画像URL</label>
                <input
                  type="url"
                  value={portfolioFormData.imageUrl}
                  onChange={(e) => setPortfolioFormData({...portfolioFormData, imageUrl: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">リンク</label>
                <input
                  type="url"
                  value={portfolioFormData.link}
                  onChange={(e) => setPortfolioFormData({...portfolioFormData, link: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://example.com/project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">プラットフォーム</label>
                <select
                  value={portfolioFormData.platform}
                  onChange={(e) => setPortfolioFormData({...portfolioFormData, platform: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">選択してください</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                disabled={saving}
                loading={saving}
                size="xl"
                className="w-full"
              >
                {editingItem ? '更新' : '追加'}
              </Button>
            </form>
          </div>
        </div>
      )}

        {/* インボイス情報タブ */}
        {activeTab === 'invoice' && user?.role === 'INFLUENCER' && (
          <div
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">インボイス情報</h2>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const validation = validateInfluencerInvoiceInfo({ ...user, hasInvoiceInfo: true, invoiceInfo: invoiceFormData });
                    return (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        validation.isValid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validation.isValid ? '登録済み' : '未登録'}
                      </span>
                    );
                  })()} 
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">インボイス情報の登録が必須です</h3>
                    <p className="text-yellow-700 text-sm">
                      プロジェクトのチャット機能を利用するためには、インボイス情報の登録が必要です。以下の情報を正確に入力してください。
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleInvoiceSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">会社名/屋号 *</label>
                    <input
                      type="text"
                      value={invoiceFormData.companyName}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, companyName: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="例: 株式会社サンプル / サンプル屋"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">適格請求書発行事業者登録番号</label>
                    <input
                      type="text"
                      value={invoiceFormData.registrationNumber}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, registrationNumber: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="T123456789012"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">郵便番号</label>
                    <input
                      type="text"
                      value={invoiceFormData.postalCode}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, postalCode: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">住所 *</label>
                    <input
                      type="text"
                      value={invoiceFormData.address}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, address: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="東京都渋谷区..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">電話番号 *</label>
                    <input
                      type="tel"
                      value={invoiceFormData.phoneNumber}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, phoneNumber: e.target.value})}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="03-1234-5678"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">銀行口座情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">銀行名 *</label>
                      <input
                        type="text"
                        value={invoiceFormData.bankName}
                        onChange={(e) => setInvoiceFormData({...invoiceFormData, bankName: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="例: 三菱UFJ銀行"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">支店名 *</label>
                      <input
                        type="text"
                        value={invoiceFormData.branchName}
                        onChange={(e) => setInvoiceFormData({...invoiceFormData, branchName: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="例: 渋谷支店"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">口座種別 *</label>
                      <select
                        value={invoiceFormData.accountType}
                        onChange={(e) => setInvoiceFormData({...invoiceFormData, accountType: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">口座番号 *</label>
                      <input
                        type="text"
                        value={invoiceFormData.accountNumber}
                        onChange={(e) => setInvoiceFormData({...invoiceFormData, accountNumber: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="1234567"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">口座名義 *</label>
                      <input
                        type="text"
                        value={invoiceFormData.accountName}
                        onChange={(e) => setInvoiceFormData({...invoiceFormData, accountName: e.target.value})}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="タナカ タロウ"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  loading={saving}
                  size="xl"
                  className="w-full"
                >
                  インボイス情報を保存
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* 稼働状況タブ */}
        {activeTab === 'working' && user?.role === 'INFLUENCER' && (
          <div
          >
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">稼働状況</h2>
                <div className="flex items-center space-x-2">
                  {profile?.workingStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getWorkingStatusInfo(profile.workingStatus).color}`}>
                      {getWorkingStatusInfo(profile.workingStatus).icon} {getWorkingStatusInfo(profile.workingStatus).label}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 text-xl">💡</span>
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">稼働状況について</h3>
                    <p className="text-blue-700 text-sm">
                      稼働状況を設定することで、企業側に現在の対応可能状況をお知らせできます。<br />
                      「対応不可」や「休暇中」に設定すると、新しいプロジェクトの提案が制限される場合があります。
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleWorkingStatusSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    現在の稼働状況 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {workingStatusOptions.map(option => (
                      <label
                        key={option.value}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                          workingFormData.workingStatus === option.value
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="workingStatus"
                            value={option.value}
                            checked={workingFormData.workingStatus === option.value}
                            onChange={(e) => setWorkingFormData({
                              ...workingFormData,
                              workingStatus: e.target.value as WorkingStatus
                            })}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{option.icon}</span>
                            <div>
                              <div className="font-semibold text-gray-900">{option.label}</div>
                              <div className="text-sm text-gray-600">
                                {option.value === WorkingStatus.AVAILABLE && '新しいプロジェクトの相談を受け付けています'}
                                {option.value === WorkingStatus.BUSY && '忙しいですが、条件次第で対応可能です'}
                                {option.value === WorkingStatus.UNAVAILABLE && '現在新しいプロジェクトは受け付けていません'}
                                {option.value === WorkingStatus.BREAK && '休暇中のため、しばらく対応できません'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    稼働状況メッセージ（任意）
                  </label>
                  <textarea
                    value={workingFormData.workingStatusMessage}
                    onChange={(e) => setWorkingFormData({
                      ...workingFormData,
                      workingStatusMessage: e.target.value
                    })}
                    placeholder="稼働状況の詳細や期間などを企業側に伝えたい場合は、こちらに入力してください。&#10;例：「5月末まで繁忙期のため、6月以降の案件でしたら対応可能です」"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {workingFormData.workingStatusMessage.length}/500文字
                  </div>
                </div>

                {profile?.workingStatusUpdatedAt && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600">
                      最終更新日時: {new Date(profile.workingStatusUpdatedAt).toLocaleString('ja-JP')}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={saving}
                  loading={saving}
                  size="xl"
                  className="w-full"
                >
                  稼働状況を更新
                </Button>
              </form>
            </Card>
          </div>
        )}
    </DashboardLayout>
  );
};

export default ProfilePage;