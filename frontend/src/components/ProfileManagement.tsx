import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import {
  getMyProfile,
  updateProfile,
  addSocialAccount,
  deleteSocialAccount,
  addPortfolio,
  deletePortfolio,
  uploadPortfolioImage,
  completeRegistration,
} from '../services/api';
import { Platform, Gender } from '../types';

const profileSchema = z.object({
  displayName: z.string().min(1, '表示名は必須です').max(100, '表示名は100文字以内で入力してください'),
  bio: z.string().max(500, '自己紹介は500文字以内で入力してください').optional(),
  gender: z.nativeEnum(Gender).optional(),
  birthDate: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  prefecture: z.string().optional(),
  city: z.string().optional(),
  categories: z.array(z.string()).min(1, '最低1つのカテゴリーを選択してください'),
  priceMin: z.number().min(0, '最低価格は0以上で入力してください').optional(),
  priceMax: z.number().min(0, '最高価格は0以上で入力してください').optional(),
});

const socialAccountSchema = z.object({
  platform: z.nativeEnum(Platform),
  username: z.string().min(1, 'ユーザー名は必須です'),
  profileUrl: z.string().url('正しいURLを入力してください'),
});

const portfolioSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  description: z.string().max(1000, '説明は1000文字以内で入力してください').optional(),
  link: z.string().url('正しいURLを入力してください').optional(),
  platform: z.nativeEnum(Platform).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type SocialAccountFormData = z.infer<typeof socialAccountSchema>;
type PortfolioFormData = z.infer<typeof portfolioSchema>;

const ProfileManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'portfolio'>('profile');
  const [showSocialForm, setShowSocialForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });

  const addSocialAccountMutation = useMutation({
    mutationFn: addSocialAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setShowSocialForm(false);
    },
  });

  const deleteSocialAccountMutation = useMutation({
    mutationFn: deleteSocialAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });

  const addPortfolioMutation = useMutation({
    mutationFn: addPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setShowPortfolioForm(false);
    },
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });

  const completeRegistrationMutation = useMutation({
    mutationFn: completeRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile ? {
      displayName: profile.displayName || '',
      bio: profile.bio || '',
      gender: profile.gender,
      birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      prefecture: profile.prefecture || '',
      city: profile.city || '',
      categories: profile.categories || [],
      priceMin: profile.priceMin || undefined,
      priceMax: profile.priceMax || undefined,
    } : {},
  });

  const socialForm = useForm<SocialAccountFormData>({
    resolver: zodResolver(socialAccountSchema),
  });

  const portfolioForm = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSocialSubmit = (data: SocialAccountFormData) => {
    addSocialAccountMutation.mutate(data);
  };

  const onPortfolioSubmit = (data: PortfolioFormData) => {
    addPortfolioMutation.mutate(data);
  };

  const handleCompleteRegistration = () => {
    completeRegistrationMutation.mutate();
  };

  const categoryOptions = [
    { value: '美容', label: '美容' },
    { value: 'ファッション', label: 'ファッション' },
    { value: 'グルメ', label: 'グルメ' },
    { value: 'ライフスタイル', label: 'ライフスタイル' },
    { value: 'エンタメ', label: 'エンタメ' },
    { value: 'スポーツ', label: 'スポーツ' },
    { value: 'ビジネス', label: 'ビジネス' },
    { value: 'テクノロジー', label: 'テクノロジー' },
    { value: '教育', label: '教育' },
    { value: 'その他', label: 'その他' },
  ];

  const platformOptions = [
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'YOUTUBE', label: 'YouTube' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'TWITTER', label: 'Twitter' },
  ];

  const genderOptions = [
    { value: 'MALE', label: '男性' },
    { value: 'FEMALE', label: '女性' },
    { value: 'OTHER', label: 'その他' },
    { value: 'NOT_SPECIFIED', label: '指定なし' },
  ];

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">読み込み中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              プロフィール
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'social'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              SNSアカウント
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ポートフォリオ
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">プロフィール設定</h2>
              
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      表示名 *
                    </label>
                    <input
                      type="text"
                      {...profileForm.register('displayName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {profileForm.formState.errors.displayName && (
                      <p className="mt-1 text-sm text-red-600">
                        {profileForm.formState.errors.displayName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      性別
                    </label>
                    <Select
                      options={genderOptions}
                      value={genderOptions.find(opt => opt.value === profileForm.watch('gender'))}
                      onChange={(selected) => profileForm.setValue('gender', selected?.value as Gender)}
                      className="text-sm"
                      placeholder="性別を選択"
                      isClearable
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      生年月日
                    </label>
                    <input
                      type="date"
                      {...profileForm.register('birthDate')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      {...profileForm.register('phoneNumber')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      都道府県
                    </label>
                    <input
                      type="text"
                      {...profileForm.register('prefecture')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      市区町村
                    </label>
                    <input
                      type="text"
                      {...profileForm.register('city')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最低単価（円）
                    </label>
                    <input
                      type="number"
                      {...profileForm.register('priceMin', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最高単価（円）
                    </label>
                    <input
                      type="number"
                      {...profileForm.register('priceMax', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自己紹介
                  </label>
                  <textarea
                    {...profileForm.register('bio')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="あなたの活動内容や得意分野について教えてください"
                  />
                  {profileForm.formState.errors.bio && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー *
                  </label>
                  <Select
                    isMulti
                    options={categoryOptions}
                    value={categoryOptions.filter(opt => 
                      profileForm.watch('categories')?.includes(opt.value)
                    )}
                    onChange={(selected) => profileForm.setValue(
                      'categories', 
                      selected ? selected.map(s => s.value) : []
                    )}
                    className="text-sm"
                    placeholder="カテゴリーを選択"
                  />
                  {profileForm.formState.errors.categories && (
                    <p className="mt-1 text-sm text-red-600">
                      {profileForm.formState.errors.categories.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'social' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">SNSアカウント</h2>
                <button
                  onClick={() => setShowSocialForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  アカウント追加
                </button>
              </div>

              {profile?.socialAccounts.map((account) => (
                <div key={account.id} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {account.platform}
                      </h3>
                      <p className="text-sm text-gray-600">@{account.username}</p>
                      <p className="text-sm text-gray-600">
                        フォロワー: {account.followerCount.toLocaleString()}
                      </p>
                      {account.engagementRate && (
                        <p className="text-sm text-gray-600">
                          エンゲージメント率: {account.engagementRate.toFixed(2)}%
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteSocialAccountMutation.mutate(account.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}

              {showSocialForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">SNSアカウント追加</h3>
                    
                    <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          プラットフォーム
                        </label>
                        <Select
                          options={platformOptions}
                          onChange={(selected) => socialForm.setValue('platform', selected?.value as Platform)}
                          className="text-sm"
                          placeholder="プラットフォームを選択"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ユーザー名
                        </label>
                        <input
                          type="text"
                          {...socialForm.register('username')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          プロフィールURL
                        </label>
                        <input
                          type="url"
                          {...socialForm.register('profileUrl')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowSocialForm(false)}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          キャンセル
                        </button>
                        <button
                          type="submit"
                          disabled={addSocialAccountMutation.isPending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addSocialAccountMutation.isPending ? '追加中...' : '追加'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">ポートフォリオ</h2>
                <button
                  onClick={() => setShowPortfolioForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  作品追加
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile?.portfolio.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      {item.platform && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                          {item.platform}
                        </span>
                      )}
                      <div className="flex justify-between items-center">
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            リンクを開く
                          </a>
                        )}
                        <button
                          onClick={() => deletePortfolioMutation.mutate(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showPortfolioForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-lg font-semibold mb-4">作品追加</h3>
                    
                    <form onSubmit={portfolioForm.handleSubmit(onPortfolioSubmit)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          タイトル
                        </label>
                        <input
                          type="text"
                          {...portfolioForm.register('title')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          説明
                        </label>
                        <textarea
                          {...portfolioForm.register('description')}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          リンク
                        </label>
                        <input
                          type="url"
                          {...portfolioForm.register('link')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          プラットフォーム
                        </label>
                        <Select
                          options={platformOptions}
                          onChange={(selected) => portfolioForm.setValue('platform', selected?.value as Platform)}
                          className="text-sm"
                          placeholder="プラットフォームを選択"
                          isClearable
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowPortfolioForm(false)}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          キャンセル
                        </button>
                        <button
                          type="submit"
                          disabled={addPortfolioMutation.isPending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addPortfolioMutation.isPending ? '追加中...' : '追加'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Registration Status */}
        {profile && !profile.isRegistered && (
          <div className="border-t border-gray-200 p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    プロフィール登録が完了していません
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    表示名、カテゴリー、SNSアカウントを設定してから登録を完了してください
                  </p>
                </div>
                <button
                  onClick={handleCompleteRegistration}
                  disabled={
                    !profile.displayName || 
                    !profile.categories?.length || 
                    !profile.socialAccounts?.length ||
                    completeRegistrationMutation.isPending
                  }
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {completeRegistrationMutation.isPending ? '登録中...' : '登録完了'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManagement;