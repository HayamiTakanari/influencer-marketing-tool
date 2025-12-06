import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Chapter1Register.module.css';

type RegistrationStep = 'select-role' | 'account-details' | 'email-verification' | 'document-upload' | 'completion';
type UserRole = 'COMPANY' | 'INFLUENCER';

const Chapter1RegisterPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('select-role');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    legalNumber: '',
    representativeName: '',
    industry: '',
    displayName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [userId, setUserId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('BUSINESS_REGISTRATION');
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setFormData({
      ...formData,
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      displayName: '',
    });
    setCurrentStep('account-details');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const validateAccountDetails = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('メールアドレスとパスワードを入力してください');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      return false;
    }

    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return false;
    }

    if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/\d/.test(formData.password)) {
      setError('パスワードには大文字、小文字、数字を含める必要があります');
      return false;
    }

    if (userRole === 'COMPANY' && !formData.companyName) {
      setError('企業名を入力してください');
      return false;
    }

    if (userRole === 'INFLUENCER' && !formData.displayName) {
      setError('表示名を入力してください');
      return false;
    }

    return true;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAccountDetails()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chapter1/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: userRole,
          ...(userRole === 'COMPANY' && {
            companyName: formData.companyName,
            legalNumber: formData.legalNumber,
            representativeName: formData.representativeName,
            industry: formData.industry,
          }),
          ...(userRole === 'INFLUENCER' && {
            displayName: formData.displayName,
          }),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '登録に失敗しました');
      }

      const data = await response.json();
      setUserId(data.user.id);
      setCurrentStep('email-verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedDocument(e.target.files[0]);
      setError('');
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedDocument) {
      setError('ファイルを選択してください');
      return;
    }

    if (!verificationToken) {
      setError('メール認証を完了してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', uploadedDocument);
      formData.append('documentType', documentType);

      const response = await fetch('/api/chapter1/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${verificationToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'ファイルアップロードに失敗しました');
      }

      setCurrentStep('completion');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルアップロードに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Role Selection
  if (currentStep === 'select-role') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>ユーザー登録</h1>
          <p className={styles.subtitle}>あなたのアカウントタイプを選択してください</p>

          <div className={styles.roleSelection}>
            <button
              className={`${styles.roleCard} ${styles.companyCard}`}
              onClick={() => handleRoleSelect('COMPANY')}
            >
              <div className={styles.roleIcon}>🏢</div>
              <h2>企業</h2>
              <p>インフルエンサーマーケティング案件を発注</p>
              <ul className={styles.features}>
                <li>インフルエンサー検索・スカウト</li>
                <li>案件管理</li>
                <li>チャット機能</li>
              </ul>
            </button>

            <button
              className={`${styles.roleCard} ${styles.influencerCard}`}
              onClick={() => handleRoleSelect('INFLUENCER')}
            >
              <div className={styles.roleIcon}>⭐</div>
              <h2>インフルエンサー</h2>
              <p>案件を受注・成果を上げる</p>
              <ul className={styles.features}>
                <li>案件検索・応募</li>
                <li>実績管理</li>
                <li>収入管理</li>
              </ul>
            </button>
          </div>

          <div className={styles.footer}>
            <p>
              既にアカウントをお持ちですか？ <Link href="/login">ログインする</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Account Details
  if (currentStep === 'account-details') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <button className={styles.backButton} onClick={() => setCurrentStep('select-role')}>
            ← 戻る
          </button>

          <h1 className={styles.title}>
            {userRole === 'COMPANY' ? '企業アカウント登録' : 'インフルエンサーアカウント登録'}
          </h1>
          <p className={styles.stepIndicator}>ステップ 1/3: アカウント情報</p>

          <form onSubmit={handleRegisterSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="email">メールアドレス *</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">パスワード *</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="8文字以上（大文字・小文字・数字を含む）"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">パスワード確認 *</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="パスワードを再度入力"
                required
              />
            </div>

            {userRole === 'COMPANY' && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="companyName">企業名 *</label>
                  <input
                    id="companyName"
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="株式会社〇〇"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="representativeName">代表者名</label>
                  <input
                    id="representativeName"
                    type="text"
                    name="representativeName"
                    value={formData.representativeName}
                    onChange={handleInputChange}
                    placeholder="山田太郎"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="legalNumber">法人番号</label>
                  <input
                    id="legalNumber"
                    type="text"
                    name="legalNumber"
                    value={formData.legalNumber}
                    onChange={handleInputChange}
                    placeholder="1234567890123"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="industry">業種</label>
                  <select name="industry" value={formData.industry} onChange={handleInputChange}>
                    <option value="">選択してください</option>
                    <option value="IT">IT</option>
                    <option value="EC">EC</option>
                    <option value="Beauty">美容</option>
                    <option value="Fashion">ファッション</option>
                    <option value="Food">食品</option>
                    <option value="Other">その他</option>
                  </select>
                </div>
              </>
            )}

            {userRole === 'INFLUENCER' && (
              <div className={styles.formGroup}>
                <label htmlFor="displayName">表示名 *</label>
                <input
                  id="displayName"
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="山田花子"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'リクエスト中...' : 'メール確認へ進む'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Email Verification
  if (currentStep === 'email-verification') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>メール確認</h1>
          <p className={styles.stepIndicator}>ステップ 2/3: メールアドレス認証</p>

          <div className={styles.verificationBox}>
            <div className={styles.verificationIcon}>📧</div>
            <p className={styles.verificationText}>
              {formData.email} にメール確認メールを送信しました。
            </p>
            <p className={styles.verificationSubtext}>
              メール内のリンクをクリックして、メールアドレスを確認してください。
            </p>

            <div className={styles.formGroup}>
              <label htmlFor="token">確認トークン（メール内のリンク）:</label>
              <input
                id="token"
                type="text"
                value={verificationToken}
                onChange={(e) => {
                  setVerificationToken(e.target.value);
                  setError('');
                }}
                placeholder="メール内のリンクから自動的に確認されます"
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              className={styles.submitButton}
              onClick={() => {
                if (verificationToken) {
                  setCurrentStep('document-upload');
                } else {
                  setError('メールから確認トークンをコピーしてください');
                }
              }}
            >
              次へ進む
            </button>

            <p className={styles.helpText}>
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Document Upload
  if (currentStep === 'document-upload') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>本人確認書類の提出</h1>
          <p className={styles.stepIndicator}>ステップ 3/3: 本人確認</p>

          <form onSubmit={handleDocumentUpload} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label>書類の種類 *</label>
              <select
                value={documentType}
                onChange={(e) => {
                  setDocumentType(e.target.value);
                  setError('');
                }}
              >
                {userRole === 'COMPANY' && (
                  <>
                    <option value="BUSINESS_REGISTRATION">登記簿謄本</option>
                    <option value="INVOICE_DOCUMENT">インボイス書類</option>
                  </>
                )}
                {userRole === 'INFLUENCER' && (
                  <option value="ID_DOCUMENT">身分証明書（運転免許証・パスポート等）</option>
                )}
              </select>
            </div>

            <div className={styles.fileUploadBox}>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className={styles.fileInput}
              />
              <div
                className={styles.dropZone}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.uploadIcon}>📄</div>
                <p>ファイルをここにドラッグ＆ドロップ</p>
                <p className={styles.uploadSubtext}>またはクリックして選択</p>
                <p className={styles.uploadNote}>PDF / JPG / PNG（最大10MB）</p>
              </div>
            </div>

            {uploadedDocument && (
              <div className={styles.uploadedFile}>
                <span>✓ {uploadedDocument.name}</span>
                <button
                  type="button"
                  onClick={() => setUploadedDocument(null)}
                  className={styles.removeButton}
                >
                  削除
                </button>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !uploadedDocument}
            >
              {loading ? 'アップロード中...' : '提出'}
            </button>

            <p className={styles.helpText}>
              書類は安全に暗号化されて保存されます。詳細は<Link href="/privacy">プライバシーポリシー</Link>をご確認ください。
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Step 5: Completion
  if (currentStep === 'completion') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.completionBox}>
            <div className={styles.completionIcon}>✓</div>
            <h1 className={styles.completionTitle}>登録が完了しました！</h1>
            <p className={styles.completionText}>
              アカウント登録ありがとうございます。
            </p>
            <p className={styles.completionSubtext}>
              書類の確認後、メールにてお知らせいたします。
              通常、確認には1〜3営業日いただいております。
            </p>

            <div className={styles.nextStepsBox}>
              <h3>次のステップ:</h3>
              <ol>
                <li>メール確認メールを受け取り、リンクをクリック</li>
                <li>書類確認のメールを待つ</li>
                <li>確認完了後、プラットフォームを利用開始</li>
              </ol>
            </div>

            <button
              className={styles.submitButton}
              onClick={() => router.push('/dashboard')}
            >
              ダッシュボードへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Chapter1RegisterPage;
