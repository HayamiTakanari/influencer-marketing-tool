import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import Card from '../../components/shared/Card';

const CompanyProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: '株式会社サンプル',
    industry: '美容・化粧品',
    contactName: '田中太郎',
    contactPhone: '03-1234-5678',
    address: '東京都渋谷区青山1-1-1',
    website: 'https://example.com',
    description: 'サンプル企業の概要です。美容・化粧品を中心とした事業を展開しています。',
    budget: 1000000,
    targetAudience: '20-30代女性',
    location: '東京都',
    bankName: '',
    branchName: '',
    accountType: '',
    accountNumber: '',
    accountName: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    setLoading(false);
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      // 企業情報をバックエンドに送信
      const response = await fetch(`${apiBaseUrl}/profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // プロフィール用フィールドのみ送信
          displayName: formData.companyName,
          address: formData.address,
          phoneNumber: formData.contactPhone,
          bio: formData.description,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      console.log('Profile saved successfully:', data);
      setIsEditing(false);
      alert('プロフィールが保存されました');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('プロフィールの保存に失敗しました');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="企業プロフィール" subtitle="会社情報を管理">
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="企業プロフィール" subtitle="会社情報を管理">
      <div className="max-w-2xl space-y-4">
        {/* Header with Edit Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{formData.companyName}</h2>
            <p className="text-gray-600 mt-1">{formData.industry}</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium whitespace-nowrap"
          >
            {isEditing ? 'キャンセル' : '編集'}
          </button>
        </div>

        {/* Basic Information */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">会社名</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">業界</label>
              <input
                type="text"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">担当者</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">電話</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">住所</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Webサイト</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">概要</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
        </Card>

        {/* Campaign Information */}
        <Card>
          <h4 className="font-semibold text-gray-900 mb-3">キャンペーン情報</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">予算</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">ターゲット</label>
              <input
                type="text"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">地域</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
        </Card>

        {/* Bank Account Information */}
        <Card>
          <h4 className="font-semibold text-gray-900 mb-3">口座情報</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">銀行名</label>
              <input
                type="text"
                name="bankName"
                placeholder="例：三菱UFJ銀行"
                value={formData.bankName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">支店名</label>
              <input
                type="text"
                name="branchName"
                placeholder="例：渋谷支店"
                value={formData.branchName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">種別</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              >
                <option value="">選択</option>
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">口座番号</label>
              <input
                type="text"
                name="accountNumber"
                placeholder="例：1234567"
                value={formData.accountNumber}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">口座名義</label>
              <input
                type="text"
                name="accountName"
                placeholder="例：カブシキガイシャ〇〇"
                value={formData.accountName}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-50"
              />
            </div>
          </div>
        </Card>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            >
              保存
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CompanyProfilePage;
