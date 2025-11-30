import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingState from '../../components/common/LoadingState';
import Card from '../../components/shared/Card';
import { FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';
import { SiX } from 'react-icons/si';

const CompanyProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    contactName: '',
    contactPhone: '',
    address: '',
    website: '',
    description: '',
    instagramUrl: '',
    instagramUserId: '',
    tiktokUrl: '',
    tiktokUserId: '',
    youtubeUrl: '',
    youtubeUserId: '',
    twitterUrl: '',
    twitterUserId: '',
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

    // Fetch company profile data from API
    fetchCompanyProfile(token);
  }, [router]);

  const fetchCompanyProfile = async (token: string) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiBaseUrl}/company-profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const profileData = result.data;
          const bankAccount = profileData.bankAccounts?.[0];
          setFormData({
            companyName: profileData.companyName || '',
            industry: profileData.industry || '',
            contactName: profileData.contactName || '',
            contactPhone: profileData.phoneNumber || '',
            address: profileData.address || '',
            website: profileData.website || '',
            description: profileData.description || '',
            instagramUrl: profileData.instagramUrl || '',
            instagramUserId: profileData.instagramUserId || '',
            tiktokUrl: profileData.tiktokUrl || '',
            tiktokUserId: profileData.tiktokUserId || '',
            youtubeUrl: profileData.youtubeUrl || '',
            youtubeUserId: profileData.youtubeUserId || '',
            twitterUrl: profileData.twitterUrl || '',
            twitterUserId: profileData.twitterUserId || '',
            bankName: bankAccount?.bankName || '',
            branchName: bankAccount?.branchName || '',
            accountType: bankAccount?.accountType || '',
            accountNumber: bankAccount?.accountNumber || '',
            accountName: bankAccount?.accountHolder || '',
          });
        }
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  }

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

      // 企業情報をバックエンドに送信（すべてのフィールド）
      const payload = {
        companyName: formData.companyName,
        industry: formData.industry,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        address: formData.address,
        website: formData.website,
        description: formData.description,
        instagramUrl: formData.instagramUrl,
        instagramUserId: formData.instagramUserId,
        tiktokUrl: formData.tiktokUrl,
        tiktokUserId: formData.tiktokUserId,
        youtubeUrl: formData.youtubeUrl,
        youtubeUserId: formData.youtubeUserId,
        twitterUrl: formData.twitterUrl,
        twitterUserId: formData.twitterUserId,
        bankName: formData.bankName,
        branchName: formData.branchName,
        accountType: formData.accountType,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
      };

      const response = await fetch(`${apiBaseUrl}/company-profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      setIsEditing(false);
      alert('プロフィールが保存されました');
      // データを再取得
      await fetchCompanyProfile(token);
    } catch (error) {
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
      <div className="w-full space-y-4">
        {/* Unified Card */}
        <Card padding="md">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">企業情報</h3>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 whitespace-nowrap"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-900 rounded text-sm font-medium hover:bg-gray-400 whitespace-nowrap"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 whitespace-nowrap"
                >
                  編集
                </button>
              )}
            </div>
          </div>

          {/* Basic Information Section */}
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
              {isEditing ? (
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              ) : (
                <div>
                  {formData.website ? (
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline break-all text-sm"
                    >
                      {formData.website}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">未設定</span>
                  )}
                </div>
              )}
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

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* SNS Accounts Section */}
          <h4 className="font-semibold text-gray-900 mb-4">SNSアカウント</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Instagram */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaInstagram className="text-pink-600" size={24} />
                <h5 className="font-semibold text-gray-900">Instagram</h5>
              </div>
              {isEditing ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">ユーザーID</label>
                  <input
                    type="text"
                    name="instagramUserId"
                    placeholder="@username"
                    value={formData.instagramUserId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              ) : (
                <div>
                  {formData.instagramUserId ? (
                    <a
                      href={`https://instagram.com/${formData.instagramUserId.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium break-all"
                    >
                      @{formData.instagramUserId.replace('@', '')}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">未設定</span>
                  )}
                </div>
              )}
            </div>

            {/* TikTok */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaTiktok className="text-gray-900" size={24} />
                <h5 className="font-semibold text-gray-900">TikTok</h5>
              </div>
              {isEditing ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">ユーザーID</label>
                  <input
                    type="text"
                    name="tiktokUserId"
                    placeholder="@username"
                    value={formData.tiktokUserId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              ) : (
                <div>
                  {formData.tiktokUserId ? (
                    <a
                      href={`https://www.tiktok.com/@${formData.tiktokUserId.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium break-all"
                    >
                      @{formData.tiktokUserId.replace('@', '')}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">未設定</span>
                  )}
                </div>
              )}
            </div>

            {/* YouTube */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FaYoutube className="text-red-600" size={24} />
                <h5 className="font-semibold text-gray-900">YouTube</h5>
              </div>
              {isEditing ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">ユーザーID</label>
                  <input
                    type="text"
                    name="youtubeUserId"
                    placeholder="@username"
                    value={formData.youtubeUserId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              ) : (
                <div>
                  {formData.youtubeUserId ? (
                    <a
                      href={`https://youtube.com/@${formData.youtubeUserId.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium break-all"
                    >
                      @{formData.youtubeUserId.replace('@', '')}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">未設定</span>
                  )}
                </div>
              )}
            </div>

            {/* X (formerly Twitter) */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <SiX className="text-gray-900" size={24} />
                <h5 className="font-semibold text-gray-900">X</h5>
              </div>
              {isEditing ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">ユーザーID</label>
                  <input
                    type="text"
                    name="twitterUserId"
                    placeholder="@username"
                    value={formData.twitterUserId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              ) : (
                <div>
                  {formData.twitterUserId ? (
                    <a
                      href={`https://x.com/${formData.twitterUserId.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium break-all"
                    >
                      @{formData.twitterUserId.replace('@', '')}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">未設定</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Bank Account Information Section */}
          <h4 className="font-semibold text-gray-900 mb-4">口座情報</h4>
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

      </div>
    </DashboardLayout>
  );
};

export default CompanyProfilePage;
