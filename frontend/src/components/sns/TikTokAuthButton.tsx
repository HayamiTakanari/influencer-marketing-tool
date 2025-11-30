import React, { useState } from 'react';
import styles from './TikTokAuth.module.css';

interface TikTokAuthButtonProps {
  onSuccess?: (account: TikTokAccount) => void;
  onError?: (error: string) => void;
}

interface TikTokAccount {
  username: string;
  displayName: string;
  followerCount: number;
  followingCount: number;
  videoCount: number;
  verified: boolean;
  profileUrl: string;
}

const TikTokAuthButton: React.FC<TikTokAuthButtonProps> = ({ onSuccess, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleAuthenticate = async () => {
    if (!username.trim()) {
      setError('TikTok ユーザー名を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // トークンを取得
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        throw new Error('認証トークンが見つかりません');
      }

      // TikTok 認証 API を呼び出し
      const response = await fetch('/api/sns/tiktok/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tikTokUsername: username.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'TikTok 認証に失敗しました');
      }

      const data = await response.json();
      setIsVerified(true);
      setUsername('');
      setIsOpen(false);

      if (onSuccess) {
        onSuccess(data.account);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'TikTok 認証に失敗しました';
      setError(errorMsg);

      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {!isVerified ? (
        <>
          <button
            className={styles.tikTokButton}
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading}
          >
            <span className={styles.icon}>🎵</span>
            TikTok を接続
          </button>

          {isOpen && (
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>TikTok アカウントを接続</h3>
                <p>あなたの TikTok ユーザー名を入力してください</p>

                <input
                  type="text"
                  placeholder="例: tiktok_username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  className={styles.input}
                  disabled={loading}
                />

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.buttonGroup}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setIsOpen(false);
                      setError('');
                    }}
                    disabled={loading}
                  >
                    キャンセル
                  </button>
                  <button
                    className={styles.confirmButton}
                    onClick={handleAuthenticate}
                    disabled={loading || !username.trim()}
                  >
                    {loading ? '検証中...' : '接続'}
                  </button>
                </div>

                <p className={styles.info}>
                  TikTok の情報は暗号化されて安全に保存されます
                </p>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.verified}>
          <span className={styles.checkmark}>✓</span>
          <span>TikTok アカウントが接続されています</span>
        </div>
      )}
    </div>
  );
};

export default TikTokAuthButton;
