import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { checkYakujihoViolations, YakujihoCheckResult } from '../../services/yakujiho-checker';
import { YakujihoHighlightedText, YakujihoCheckSummary } from '../../components/YakujihoHighlightedText';

interface VideoSubmission {
  id: string;
  title: string;
  description: string;
  videoFile: File | null;
  thumbnailFile: File | null;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  revisionNotes?: string;
  yakujihoCheck?: YakujihoCheckResult;
  duration?: number;
  fileSize?: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  clientName: string;
}

const ProjectSubmissionsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [checkingYakujiho, setCheckingYakujiho] = useState(false);
  const router = useRouter();
  const { projectId } = router.query;

  // 新規投稿フォーム
  const [newSubmission, setNewSubmission] = useState<VideoSubmission>({
    id: '',
    title: '',
    description: '',
    videoFile: null,
    thumbnailFile: null,
    status: 'draft'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (projectId) {
      loadProject();
      loadSubmissions();
    }
  }, [projectId, router]);

  const loadProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        console.error('Failed to load project:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/submissions?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(Array.isArray(data) ? data : data.submissions || []);
      } else {
        console.error('Failed to load submissions:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewSubmission(prev => ({ ...prev, videoFile: file }));
    }
  };

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewSubmission(prev => ({ ...prev, thumbnailFile: file }));
    }
  };

  const checkYakujiho = async () => {
    if (!newSubmission.description.trim()) {
      alert('動画の説明文を入力してください');
      return;
    }

    setCheckingYakujiho(true);
    try {
      const result = await checkYakujihoViolations(newSubmission.description);
      setNewSubmission(prev => ({
        ...prev,
        yakujihoCheck: result
      }));
    } catch (error) {
      console.error('薬機法チェックエラー:', error);
      alert('薬機法チェックに失敗しました');
    } finally {
      setCheckingYakujiho(false);
    }
  };

  const submitVideo = async () => {
    if (!newSubmission.title.trim() || !newSubmission.description.trim() || !newSubmission.videoFile) {
      alert('タイトル、説明文、動画ファイルは必須です');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', newSubmission.title);
      formData.append('description', newSubmission.description);
      formData.append('videoFile', newSubmission.videoFile);
      if (newSubmission.thumbnailFile) {
        formData.append('thumbnailFile', newSubmission.thumbnailFile);
      }
      formData.append('projectId', projectId as string);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        const submission = await response.json();
        setSubmissions(prev => [submission, ...prev]);

        // Reset form
        setNewSubmission({
          id: '',
          title: '',
          description: '',
          videoFile: null,
          thumbnailFile: null,
          status: 'draft'
        });

        alert('動画を投稿しました！');
      } else {
        throw new Error('投稿に失敗しました');
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      alert('投稿に失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft': return { label: '下書き', color: 'bg-gray-100 text-gray-800' };
      case 'submitted': return { label: '審査中', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved': return { label: '承認済み', color: 'bg-green-100 text-green-800' };
      case 'rejected': return { label: '差し戻し', color: 'bg-red-100 text-red-800' };
      case 'revision_requested': return { label: '修正依頼', color: 'bg-orange-100 text-orange-800' };
      default: return { label: '不明', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">プロジェクトが見つかりません</h3>
          <Link href="/projects">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600">
              プロジェクト一覧に戻る
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* ランディングページと同じ背景デザイン */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d1fae5, #10b981, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-gray-900">
              InfluenceLink
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="pt-20 pb-12 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* ページタイトル */}
          <div className="mb-8 transition-all">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/projects">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  ← プロジェクト一覧
                </button>
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">動画投稿・管理</h1>
            <h2 className="text-2xl text-gray-600">{project.title}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 新規投稿フォーム */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-6">新規動画投稿</h3>
                
                <div className="space-y-6">
                  {/* タイトル */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      動画タイトル *
                    </label>
                    <input
                      type="text"
                      value={newSubmission.title}
                      onChange={(e) => setNewSubmission(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="例: ファンデーションレビュー動画"
                    />
                  </div>

                  {/* 説明文 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      投稿内容・説明文 *
                    </label>
                    <textarea
                      value={newSubmission.description}
                      onChange={(e) => setNewSubmission(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="動画の内容や商品の使用感について説明してください..."
                    />
                    
                    {/* 薬機法チェックボタン */}
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={checkYakujiho}
                        disabled={checkingYakujiho || !newSubmission.description.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {checkingYakujiho ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            チェック中...
                          </>
                        ) : (
                          <>
                            ⚖️ 薬機法チェック
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 薬機法チェック結果 */}
                  {newSubmission.yakujihoCheck && (
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">薬機法チェック結果</h4>
                      <YakujihoCheckSummary result={newSubmission.yakujihoCheck} />
                      <div className="mt-4">
                        <h5 className="font-medium text-blue-800 mb-2">チェック済みテキスト:</h5>
                        <div className="bg-white p-3 rounded border text-sm">
                          <YakujihoHighlightedText 
                            text={newSubmission.description} 
                            violations={newSubmission.yakujihoCheck.violations} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 動画ファイル */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      動画ファイル * (MP4, MOV, AVI対応)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {newSubmission.videoFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        選択済み: {newSubmission.videoFile.name} ({formatFileSize(newSubmission.videoFile.size)})
                      </p>
                    )}
                  </div>

                  {/* サムネイル */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      サムネイル画像 (任意)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {newSubmission.thumbnailFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        選択済み: {newSubmission.thumbnailFile.name}
                      </p>
                    )}
                  </div>

                  {/* 投稿ボタン */}
                  <div className="flex gap-4">
                    <button
                      onClick={submitVideo}
                      disabled={uploading || !newSubmission.title.trim() || !newSubmission.description.trim() || !newSubmission.videoFile}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          投稿中...
                        </>
                      ) : (
                        <>
                          📤 動画を投稿
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* プロジェクト情報 */}
            <div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6 transition-all">
                <h3 className="text-lg font-bold text-gray-900 mb-4">プロジェクト詳細</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">クライアント:</span>
                    <p className="text-gray-900">{project.clientName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">カテゴリ:</span>
                    <p className="text-gray-900">{project.category}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">予算:</span>
                    <p className="text-gray-900">¥{project.budget.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">説明:</span>
                    <p className="text-gray-900">{project.description}</p>
                  </div>
                </div>
              </div>

              {/* 投稿ガイドライン */}
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 transition-all">
                <h4 className="text-lg font-semibold text-amber-800 mb-3">📝 投稿ガイドライン</h4>
                <ul className="text-sm text-amber-700 space-y-2">
                  <li>• 薬機法チェックを必ず実行してください</li>
                  <li>• 動画は1080p以上を推奨します</li>
                  <li>• ファイルサイズは500MB以下にしてください</li>
                  <li>• 商品の効果・効能に関する表現にご注意ください</li>
                  <li>• 投稿後、24時間以内に承認結果をお知らせします</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 投稿履歴 */}
          <div className="mt-8 transition-all">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">投稿履歴</h3>
            
            {submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{submission.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{submission.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(submission.status).color}`}>
                        {getStatusInfo(submission.status).label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      {submission.duration && (
                        <span>⏱️ {formatDuration(submission.duration)}</span>
                      )}
                      {submission.fileSize && (
                        <span>📁 {formatFileSize(submission.fileSize)}</span>
                      )}
                      {submission.submittedAt && (
                        <span>📅 {new Date(submission.submittedAt).toLocaleDateString('ja-JP')}</span>
                      )}
                    </div>
                    
                    {submission.revisionNotes && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <h5 className="font-medium text-orange-800 mb-1">修正依頼</h5>
                        <p className="text-orange-700 text-sm">{submission.revisionNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="text-6xl mb-4">📹</div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">まだ投稿がありません</h4>
                <p className="text-gray-600">上記のフォームから最初の動画を投稿してみましょう！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSubmissionsPage;