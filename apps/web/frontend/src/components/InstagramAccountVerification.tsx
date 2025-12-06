import React, { useState, useEffect } from 'react';
import { FaInstagram, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import Button from './shared/Button';
import Card from './shared/Card';
import api from '../services/api';

interface InstagramVerificationProps {
  onSuccess?: (socialAccount: any) => void;
  onError?: (error: string) => void;
  existingAccount?: {
    id: string;
    username: string;
    profileUrl: string;
    isVerified: boolean;
  } | null;
}

interface InstagramUserInfo {
  username: string;
  nickname: string;
  avatarUrl: string;
  profileUrl: string;
}

const InstagramAccountVerification: React.FC<InstagramVerificationProps> = ({
  onSuccess,
  onError,
  existingAccount,
}) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [userInfo, setUserInfo] = useState<InstagramUserInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [step, setStep] = useState<'input' | 'preview' | 'confirm'>('input');

  // Initialize with existing account if provided
  useEffect(() => {
    if (existingAccount) {
      setUsername(existingAccount.username);
      setDisplayName(existingAccount.username);
    }
  }, [existingAccount]);

  // Validate Instagram username format
  const isValidInstagramUsername = (username: string): boolean => {
    // Username should be 1-30 characters, alphanumeric with dots and underscores
    const usernameRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return usernameRegex.test(username.trim());
  };

  // Fetch user information from Instagram API by username
  const handleFetchUserInfo = async () => {
    try {
      setLoading(true);
      setMessage(null);

      if (!username.trim()) {
        setMessage({ type: 'error', text: 'Instagram ユーザー名を入力してください' });
        setLoading(false);
        return;
      }

      if (!isValidInstagramUsername(username)) {
        setMessage({ type: 'error', text: '無効なユーザー名です。1～30文字の英数字（. _ を含む）で入力してください' });
        setLoading(false);
        return;
      }

      // Fetch user info from backend
      const response = await api.get(`/instagram/user/${username.trim()}`);

      if (response.data.success) {
        setUserInfo(response.data.data);
        setDisplayName(response.data.data.username);
        setStep('preview');
        setMessage({
          type: 'info',
          text: `@${response.data.data.username} の Instagram プロフィール情報を取得しました`,
        });
      } else {
        setMessage({ type: 'error', text: 'プロフィール情報の取得に失敗しました' });
      }
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'プロフィール情報の取得に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify and add Instagram account using username
  const handleVerifyAccount = async () => {
    try {
      setVerifying(true);
      setMessage(null);

      if (!username || !displayName) {
        setMessage({ type: 'error', text: 'すべてのフィールドを入力してください' });
        setVerifying(false);
        return;
      }

      const response = await api.post('/instagram/verify-account', {
        username: username.trim(),
        displayName: displayName.trim(),
      });

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: 'Instagram アカウントが正常に認証されました',
        });
        setStep('confirm');

        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.data.socialAccount);
        }

        // Reset form after 2 seconds
        setTimeout(() => {
          setUsername('');
          setDisplayName('');
          setUserInfo(null);
          setStep('input');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error verifying account:', error);
      const errorMessage = error.response?.data?.message || 'アカウント認証に失敗しました';
      setMessage({ type: 'error', text: errorMessage });

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setVerifying(false);
    }
  };

  // Render user profile preview
  const renderUserPreview = () => {
    if (!userInfo) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-pink-600 flex items-center justify-center text-white text-2xl font-bold">
              {userInfo.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">
                {userInfo.username}
              </h4>
              <p className="text-sm text-gray-600">
                Instagram ユーザー名: @{userInfo.username}
              </p>
            </div>
          </div>

          <div className="bg-white rounded p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>プロフィール URL:</strong>
            </p>
            <a
              href={userInfo.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {userInfo.profileUrl}
            </a>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            このユーザーの Instagram アカウントを認証します。
          </p>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-instagram">
      <div className="flex items-center space-x-2 mb-6">
        <FaInstagram className="text-2xl text-pink-600" />
        <h3 className="text-xl font-bold text-gray-800">Instagram アカウント認証</h3>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          {message.type === 'success' ? (
            <FaCheckCircle className="text-green-500 text-lg mt-0.5" />
          ) : message.type === 'error' ? (
            <FaTimesCircle className="text-red-500 text-lg mt-0.5" />
          ) : (
            <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
          )}
          <p
            className={
              message.type === 'success'
                ? 'text-green-800'
                : message.type === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }
          >
            {message.text}
          </p>
        </div>
      )}

      {step === 'input' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instagram ユーザー名 <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              あなたの Instagram ユーザー名を入力してください。（例: instagram、username など）
            </p>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-200 text-gray-700 rounded-l-lg border border-gray-300 border-r-0">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
                disabled={loading || verifying}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表示名（オプション）
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="あなたの表示名"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent"
              disabled={loading || verifying}
            />
          </div>

          <Button
            onClick={handleFetchUserInfo}
            disabled={loading || !username.trim()}
            className="w-full bg-pink-600 text-white"
          >
            {loading ? (
              <>
                <FaSpinner className="inline mr-2 animate-spin" />
                ユーザー情報を確認中...
              </>
            ) : (
              'ユーザーを確認'
            )}
          </Button>
        </div>
      )}

      {step === 'preview' && userInfo && (
        <div className="space-y-4">
          {renderUserPreview()}

          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setStep('input');
                setUserInfo(null);
              }}
              variant="outline"
              className="flex-1"
              disabled={verifying}
            >
              戻る
            </Button>
            <Button
              onClick={handleVerifyAccount}
              disabled={verifying}
              className="flex-1 bg-pink-600 text-white"
            >
              {verifying ? (
                <>
                  <FaSpinner className="inline mr-2 animate-spin" />
                  認証中...
                </>
              ) : (
                'このアカウントを認証'
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="text-center space-y-4">
          <div className="text-5xl">
            <FaCheckCircle className="text-green-500 mx-auto" />
          </div>
          <h4 className="text-lg font-semibold text-gray-800">認証完了！</h4>
          <p className="text-gray-600">
            Instagram アカウントが正常に認証されました。
            <br />
            プロフィールが更新されます。
          </p>
        </div>
      )}

    </Card>
  );
};

export default InstagramAccountVerification;
