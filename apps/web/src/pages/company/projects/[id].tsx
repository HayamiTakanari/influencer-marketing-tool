import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/shared/Card';
import Button from '../../../components/shared/Button';
import LoadingState from '../../../components/common/LoadingState';
import EmptyState from '../../../components/common/EmptyState';
import { getProjectById } from '../../../services/api';

interface Application {
  id: string;
  influencer: {
    id: string;
    displayName: string;
    user: {
      email: string;
    };
    socialAccounts: Array<{
      platform: string;
      followerCount: number;
      isVerified: boolean;
    }>;
  };
  isAccepted: boolean;
  appliedAt: string;
  proposedPrice: number;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetPlatforms: string[];
  targetPrefecture: string;
  targetCity: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  applications: Application[];
  matchedInfluencer?: {
    id: string;
    displayName: string;
    user: {
      email: string;
    };
    socialAccounts: Array<{
      platform: string;
      followerCount: number;
      isVerified: boolean;
    }>;
  };
  // 公開設定
  isPublic?: boolean;
  // 詳細項目
  deliverables?: string;
  requirements?: string;
  additionalInfo?: string;
  advertiserName?: string;
  brandName?: string;
  productName?: string;
  productUrl?: string;
  productPrice?: number;
  productFeatures?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  postingPeriodStart?: string;
  postingPeriodEnd?: string;
  postingMedia?: string[];
  messageToConvey?: string[];
  shootingAngle?: string;
  packagePhotography?: string;
  productOrientationSpecified?: string;
  musicUsage?: string;
  brandContentSettings?: string;
  advertiserAccount?: string;
  desiredHashtags?: string[];
  ngItems?: string;
  legalRequirements?: string;
  notes?: string;
  secondaryUsage?: string;
  secondaryUsageScope?: string;
  secondaryUsagePeriod?: string;
  insightDisclosure?: string;
}

interface Submission {
  id: string;
  projectId: string;
  submissionUrl: string;
  submissionType: string;
  submissionNotes?: string;
  status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
  approvalNotes?: string;
  submittedAt: string;
  approvedAt?: string;
  influencer?: {
    displayName: string;
    user?: {
      email: string;
    };
  };
}

interface Message {
  id: string;
  projectId: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}


const ProjectDetailPage: React.FC = () => {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'chat'>('overview');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // 編集モード用の状態
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProject, setEditedProject] = useState<Partial<ProjectDetails> | null>(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (id && typeof id === 'string') {
      fetchProjectDetails(id);
    }
  }, [id, router]);

  const fetchProjectDetails = async (projectId: string) => {
    try {
      const data = await getProjectById(projectId);
      console.log('Fetched project data:', data);
      if (data) {
        // データは { project: {...} } 形式で返されるので、projectプロパティを抽出
        const projectData = data.project || data;
        console.log('Setting project:', projectData);
        setProject(projectData as ProjectDetails);
        setError('');
      } else {
        setError('プロジェクトが見つかりません。');
      }
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError('プロジェクトの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (projectId: string) => {
    try {
      setSubmissionsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/submissions/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      setActionLoading(submissionId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/submissions/${submissionId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalNotes: feedbackText || ''
        })
      });

      if (response.ok) {
        setShowFeedbackForm(null);
        setFeedbackText('');
        if (id && typeof id === 'string') {
          fetchSubmissions(id);
        }
      } else {
        setError('提出物の承認に失敗しました');
      }
    } catch (err) {
      console.error('Error approving submission:', err);
      setError('承認処理中にエラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestRevision = async (submissionId: string) => {
    if (!feedbackText.trim()) {
      setError('修正要求の説明は必須です');
      return;
    }

    try {
      setActionLoading(submissionId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/submissions/${submissionId}/revision`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalNotes: feedbackText
        })
      });

      if (response.ok) {
        setShowFeedbackForm(null);
        setFeedbackText('');
        if (id && typeof id === 'string') {
          fetchSubmissions(id);
        }
      } else {
        setError('修正要求の送信に失敗しました');
      }
    } catch (err) {
      console.error('Error requesting revision:', err);
      setError('修正要求処理中にエラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmission = async (submissionId: string) => {
    if (!feedbackText.trim()) {
      setError('却下理由は必須です');
      return;
    }

    try {
      setActionLoading(submissionId);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/submissions/${submissionId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalNotes: feedbackText
        })
      });

      if (response.ok) {
        setShowFeedbackForm(null);
        setFeedbackText('');
        if (id && typeof id === 'string') {
          fetchSubmissions(id);
        }
      } else {
        setError('提出物の却下に失敗しました');
      }
    } catch (err) {
      console.error('Error rejecting submission:', err);
      setError('却下処理中にエラーが発生しました');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      MATCHED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getSubmissionStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REVISION_REQUESTED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSubmissionStatusText = (status: string) => {
    const texts: Record<string, string> = {
      PENDING: '審査中',
      APPROVED: '承認済み',
      REVISION_REQUESTED: '修正要求',
      REJECTED: '却下'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <DashboardLayout title="プロジェクト詳細" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="エラー" subtitle="プロジェクトが見つかりません">
        <Card className="text-center py-12">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{error || 'プロジェクトが見つかりませんでした。'}</h3>
          <Link href="/company/projects/list">
            <Button variant="primary">プロジェクト一覧に戻る</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={project.title} subtitle="プロジェクト詳細">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ヘッダーとアクションボタン */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{isEditing && editedProject ? editedProject.title || project.title : project.title}</h1>
            <p className="text-gray-600">{isEditing && editedProject ? editedProject.description || project.description : project.description}</p>
          </div>
          <div className="flex gap-2 items-start">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusBadge(project.status)}`}>
              {project.status}
            </span>
            {!isEditing ? (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditedProject({ ...project });
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                編集
              </button>
            ) : (
              <>
                <button
                  onClick={async () => {
                    if (!editedProject) return;
                    try {
                      setIsSaving(true);
                      const token = localStorage.getItem('token');
                      if (!token) return;

                      // Only send fields that have values (not undefined or null)
                      const dataToSend: any = {};
                      Object.entries(editedProject).forEach(([key, value]) => {
                        if (value !== undefined && value !== null && value !== '') {
                          dataToSend[key] = value;
                        }
                      });

                      console.log('Sending data:', dataToSend);

                      const response = await fetch(`http://localhost:3001/api/projects/${project.id}`, {
                        method: 'PUT',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(dataToSend)
                      });

                      if (response.ok) {
                        const updatedData = await response.json();
                        const projectData = updatedData.project || updatedData;
                        setProject(projectData as ProjectDetails);
                        setIsEditing(false);
                        setEditedProject(null);
                        setError('');
                        alert('プロジェクトが正常に更新されました');
                      } else {
                        const errorData = await response.json();
                        console.error('Error response:', errorData);
                        setError(errorData.error || 'プロジェクトの更新に失敗しました');
                      }
                    } catch (err: any) {
                      console.error('Error updating project:', err);
                      setError('プロジェクトの更新処理中にエラーが発生しました');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedProject(null);
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg font-medium hover:bg-gray-500 transition-colors"
                >
                  キャンセル
                </button>
              </>
            )}
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 基本情報 */}
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {isEditing && editedProject ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                    <input
                      type="text"
                      value={editedProject.title || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                    <textarea
                      value={editedProject.description || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
                  <p className="text-gray-600">{project.description}</p>
                </div>
              )}
            </div>
          </div>

          {isEditing && editedProject ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">予算（円）</label>
                <input
                  type="number"
                  value={editedProject.budget || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, budget: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリー</label>
                <input
                  type="text"
                  value={editedProject.category || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                <input
                  type="date"
                  value={editedProject.startDate ? new Date(editedProject.startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedProject({ ...editedProject, startDate: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                <input
                  type="date"
                  value={editedProject.endDate ? new Date(editedProject.endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedProject({ ...editedProject, endDate: new Date(e.target.value).toISOString() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
              <div>
                <p className="text-sm text-gray-600">予算</p>
                <p className="text-lg font-semibold text-gray-900">¥{project.budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">カテゴリー</p>
                <p className="text-lg font-semibold text-gray-900">{project.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">開始日</p>
                <p className="text-lg font-semibold text-gray-900">{new Date(project.startDate).toLocaleDateString('ja-JP')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">終了日</p>
                <p className="text-lg font-semibold text-gray-900">{new Date(project.endDate).toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          )}
        </Card>

        {/* 公開設定 */}
        {project.isPublic !== undefined && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">公開設定</h2>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="font-semibold text-gray-900 mb-2">
                  {project.isPublic ? '公開' : '非公開（招待制）'}
                </p>
                <p className="text-sm text-gray-600">
                  {project.isPublic
                    ? '全ての認証済みインフルエンサーが検索・閲覧・応募できます'
                    : 'スカウトを送ったインフルエンサーのみが詳細を閲覧・応募できます'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ターゲット情報 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ターゲット情報</h2>
          {isEditing && editedProject ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
                <input
                  type="text"
                  value={editedProject.targetPrefecture || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, targetPrefecture: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">市区町村</label>
                <input
                  type="text"
                  value={editedProject.targetCity || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, targetCity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                <select
                  value={editedProject.targetGender || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, targetGender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="MALE">男性</option>
                  <option value="FEMALE">女性</option>
                  <option value="OTHER">その他</option>
                  <option value="NOT_SPECIFIED">指定なし</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最小年齢</label>
                <input
                  type="number"
                  value={editedProject.targetAgeMin || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, targetAgeMin: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大年齢</label>
                <input
                  type="number"
                  value={editedProject.targetAgeMax || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, targetAgeMax: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最小フォロワー数</label>
                <input
                  type="number"
                  value={editedProject.targetFollowerMin || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, targetFollowerMin: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">最大フォロワー数</label>
                <input
                  type="number"
                  value={editedProject.targetFollowerMax || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, targetFollowerMax: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">プラットフォーム</label>
                <div className="space-y-2">
                  {['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'FACEBOOK'].map((platform) => (
                    <label key={platform} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editedProject.targetPlatforms?.includes(platform) || false}
                        onChange={(e) => {
                          const platforms = editedProject.targetPlatforms || [];
                          if (e.target.checked) {
                            setEditedProject({
                              ...editedProject,
                              targetPlatforms: [...platforms, platform]
                            });
                          } else {
                            setEditedProject({
                              ...editedProject,
                              targetPlatforms: platforms.filter(p => p !== platform)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">都道府県</p>
                <p className="font-semibold text-gray-900">{project.targetPrefecture}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">市区町村</p>
                <p className="font-semibold text-gray-900">{project.targetCity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">性別</p>
                <p className="font-semibold text-gray-900">{project.targetGender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">年齢範囲</p>
                <p className="font-semibold text-gray-900">{project.targetAgeMin}~{project.targetAgeMax}才</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">フォロワー数範囲</p>
                <p className="font-semibold text-gray-900">{project.targetFollowerMin?.toLocaleString()}~{project.targetFollowerMax?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">プラットフォーム</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.targetPlatforms?.map(platform => (
                    <span key={platform} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 詳細要件セクション */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">詳細要件</h2>
          {isEditing && editedProject ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成果物・納品物</label>
                <textarea
                  value={editedProject.deliverables || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, deliverables: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">要求事項</label>
                <textarea
                  value={editedProject.requirements || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, requirements: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">その他の情報</label>
                <textarea
                  value={editedProject.additionalInfo || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, additionalInfo: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {project.deliverables && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">成果物・納品物</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.deliverables}</p>
                </div>
              )}
              {project.requirements && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">要求事項</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.requirements}</p>
                </div>
              )}
              {project.additionalInfo && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">その他の情報</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.additionalInfo}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 商品・広告主情報 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">商品・広告主情報</h2>
          {isEditing && editedProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">広告主名</label>
                <input
                  type="text"
                  value={editedProject.advertiserName || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, advertiserName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ブランド名</label>
                <input
                  type="text"
                  value={editedProject.brandName || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, brandName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品正式名称</label>
                <input
                  type="text"
                  value={editedProject.productName || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品税込価格（円）</label>
                <input
                  type="number"
                  value={editedProject.productPrice || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, productPrice: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">商品URL</label>
                <input
                  type="url"
                  value={editedProject.productUrl || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, productUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">広告主アカウント</label>
                <input
                  type="text"
                  value={editedProject.advertiserAccount || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, advertiserAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">商品特徴</label>
                <textarea
                  value={editedProject.productFeatures || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, productFeatures: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.advertiserName && (
                <div>
                  <p className="text-sm text-gray-600">広告主名</p>
                  <p className="font-semibold text-gray-900">{project.advertiserName}</p>
                </div>
              )}
              {project.brandName && (
                <div>
                  <p className="text-sm text-gray-600">ブランド名</p>
                  <p className="font-semibold text-gray-900">{project.brandName}</p>
                </div>
              )}
              {project.productName && (
                <div>
                  <p className="text-sm text-gray-600">商品正式名称</p>
                  <p className="font-semibold text-gray-900">{project.productName}</p>
                </div>
              )}
              {project.productPrice && (
                <div>
                  <p className="text-sm text-gray-600">商品税込価格</p>
                  <p className="font-semibold text-gray-900">¥{project.productPrice.toLocaleString()}</p>
                </div>
              )}
              {project.productUrl && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">商品URL</p>
                  <a href={project.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 break-all">
                    {project.productUrl}
                  </a>
                </div>
              )}
              {project.advertiserAccount && (
                <div>
                  <p className="text-sm text-gray-600">広告主アカウント</p>
                  <p className="font-semibold text-gray-900">{project.advertiserAccount}</p>
                </div>
              )}
              {project.productFeatures && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">商品特徴</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.productFeatures}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* キャンペーン詳細 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">キャンペーン詳細</h2>
          {isEditing && editedProject ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">施策の目的</label>
                <input
                  type="text"
                  value={editedProject.campaignObjective || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, campaignObjective: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">施策ターゲット</label>
                <input
                  type="text"
                  value={editedProject.campaignTarget || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, campaignTarget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">投稿期間開始</label>
                <input
                  type="date"
                  value={editedProject.postingPeriodStart ? new Date(editedProject.postingPeriodStart).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedProject({ ...editedProject, postingPeriodStart: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">投稿期間終了</label>
                <input
                  type="date"
                  value={editedProject.postingPeriodEnd ? new Date(editedProject.postingPeriodEnd).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditedProject({ ...editedProject, postingPeriodEnd: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {project.campaignObjective && (
                <div>
                  <p className="text-sm text-gray-600">施策の目的</p>
                  <p className="font-semibold text-gray-900">{project.campaignObjective}</p>
                </div>
              )}
              {project.campaignTarget && (
                <div>
                  <p className="text-sm text-gray-600">施策ターゲット</p>
                  <p className="font-semibold text-gray-900">{project.campaignTarget}</p>
                </div>
              )}
              {(project.postingPeriodStart || project.postingPeriodEnd) && (
                <div>
                  <p className="text-sm text-gray-600">投稿期間</p>
                  <p className="font-semibold text-gray-900">
                    {project.postingPeriodStart && new Date(project.postingPeriodStart).toLocaleDateString('ja-JP')}
                    {project.postingPeriodEnd && ` 〜 ${new Date(project.postingPeriodEnd).toLocaleDateString('ja-JP')}`}
                  </p>
                </div>
              )}
              {project.postingMedia && project.postingMedia.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">投稿メディア</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.postingMedia.map((media) => (
                      <span key={media} className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                        {media}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.messageToConvey && project.messageToConvey.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">投稿を通じて伝えたいこと</p>
                  <ol className="list-decimal list-inside space-y-2">
                    {project.messageToConvey.map((msg, idx) => (
                      msg && <li key={idx} className="text-gray-900">{msg}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 撮影・制作仕様 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">撮影・制作仕様</h2>
          {isEditing && editedProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">人物の撮影アングル</label>
                <input
                  type="text"
                  value={editedProject.shootingAngle || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, shootingAngle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">外装やパッケージ撮影の有無</label>
                <input
                  type="text"
                  value={editedProject.packagePhotography || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, packagePhotography: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">商品の向きの撮影指定の有無</label>
                <input
                  type="text"
                  value={editedProject.productOrientationSpecified || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, productOrientationSpecified: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">音楽使用</label>
                <input
                  type="text"
                  value={editedProject.musicUsage || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, musicUsage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ブランドコンテンツ設定</label>
                <input
                  type="text"
                  value={editedProject.brandContentSettings || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, brandContentSettings: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.shootingAngle && (
                <div>
                  <p className="text-sm text-gray-600">人物の撮影アングル</p>
                  <p className="font-semibold text-gray-900">{project.shootingAngle}</p>
                </div>
              )}
              {project.packagePhotography && (
                <div>
                  <p className="text-sm text-gray-600">外装やパッケージ撮影の有無</p>
                  <p className="font-semibold text-gray-900">{project.packagePhotography}</p>
                </div>
              )}
              {project.productOrientationSpecified && (
                <div>
                  <p className="text-sm text-gray-600">商品の向きの撮影指定の有無</p>
                  <p className="font-semibold text-gray-900">{project.productOrientationSpecified}</p>
                </div>
              )}
              {project.musicUsage && (
                <div>
                  <p className="text-sm text-gray-600">音楽使用</p>
                  <p className="font-semibold text-gray-900">{project.musicUsage}</p>
                </div>
              )}
              {project.brandContentSettings && (
                <div>
                  <p className="text-sm text-gray-600">ブランドコンテンツ設定</p>
                  <p className="font-semibold text-gray-900">{project.brandContentSettings}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ハッシュタグ・制約事項 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">ハッシュタグ・制約事項</h2>
          {isEditing && editedProject ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">希望ハッシュタグ（カンマ区切り）</label>
                <textarea
                  value={editedProject.desiredHashtags?.join(', ') || ''}
                  onChange={(e) => setEditedProject({
                    ...editedProject,
                    desiredHashtags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NG項目</label>
                <textarea
                  value={editedProject.ngItems || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, ngItems: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">薬機法に基づく表現や注釈が必要な表現</label>
                <textarea
                  value={editedProject.legalRequirements || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, legalRequirements: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">注意点</label>
                <textarea
                  value={editedProject.notes || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {project.desiredHashtags && project.desiredHashtags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">希望ハッシュタグ</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.desiredHashtags.map((tag) => (
                      tag && (
                        <span key={tag} className="inline-block bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              )}
              {project.ngItems && (
                <div>
                  <p className="text-sm text-gray-600">NG項目</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.ngItems}</p>
                </div>
              )}
              {project.legalRequirements && (
                <div>
                  <p className="text-sm text-gray-600">薬機法に基づく表現や注釈が必要な表現</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.legalRequirements}</p>
                </div>
              )}
              {project.notes && (
                <div>
                  <p className="text-sm text-gray-600">注意点</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 二次利用・開示設定 */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-6">二次利用・開示設定</h2>
          {isEditing && editedProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">二次利用有無</label>
                <input
                  type="text"
                  value={editedProject.secondaryUsage || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, secondaryUsage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">投稿のインサイト開示有無</label>
                <input
                  type="text"
                  value={editedProject.insightDisclosure || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, insightDisclosure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">二次利用範囲</label>
                <textarea
                  value={editedProject.secondaryUsageScope || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, secondaryUsageScope: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">二次利用期間</label>
                <textarea
                  value={editedProject.secondaryUsagePeriod || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, secondaryUsagePeriod: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.secondaryUsage && (
                <div>
                  <p className="text-sm text-gray-600">二次利用有無</p>
                  <p className="font-semibold text-gray-900">{project.secondaryUsage}</p>
                </div>
              )}
              {project.insightDisclosure && (
                <div>
                  <p className="text-sm text-gray-600">投稿のインサイト開示有無</p>
                  <p className="font-semibold text-gray-900">{project.insightDisclosure}</p>
                </div>
              )}
              {project.secondaryUsageScope && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">二次利用範囲</p>
                  <p className="font-semibold text-gray-900">{project.secondaryUsageScope}</p>
                </div>
              )}
              {project.secondaryUsagePeriod && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">二次利用期間</p>
                  <p className="font-semibold text-gray-900">{project.secondaryUsagePeriod}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* タブナビゲーション */}
        <Card>
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('overview');
              }}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              基本情報
            </button>
            {project.status === 'IN_PROGRESS' && project.matchedInfluencer && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('submissions');
                    if (submissions.length === 0) {
                      fetchSubmissions(project.id);
                    }
                  }}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'submissions'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  提出物（{submissions.length}）
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === 'chat'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  チャット
                </button>
              </>
            )}
          </div>
        </Card>

        {/* タブコンテンツ */}
        {activeTab === 'overview' && (
          <>
            {/* 応募者情報 */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">応募者</h2>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {project.applications?.length || 0}件
                </span>
              </div>

          {(project.applications && project.applications.length > 0) || project.matchedInfluencer ? (
            <div className="space-y-4">
              {/* 成約済みインフルエンサー */}
              {project.matchedInfluencer && (
                <div key={project.matchedInfluencer.id} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.matchedInfluencer.displayName}</h3>
                      <p className="text-sm text-gray-600">{project.matchedInfluencer.user.email}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                      成約済み
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">フォロワー数</p>
                      <p className="font-semibold text-gray-900">
                        {project.matchedInfluencer.socialAccounts.reduce((sum, acc) => sum + acc.followerCount, 0)?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-500 text-xs mb-2">プラットフォーム</p>
                    <div className="flex flex-wrap gap-2">
                      {project.matchedInfluencer.socialAccounts.map(acc => (
                        <span
                          key={acc.platform}
                          className={`inline-block text-xs px-2 py-1 rounded ${
                            acc.isVerified
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {acc.platform}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link href={`/project-chat/${project.id}`}>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      チャットを開く →
                    </button>
                  </Link>
                </div>
              )}

              {/* その他の応募者 */}
              {project.applications && project.applications.length > 0 && (
                <>
                  <div className="border-t-2 pt-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">その他の応募者</h3>
                  </div>
                  {project.applications.map(app => {
                    const totalFollowers = app.influencer.socialAccounts.reduce(
                      (sum, acc) => sum + acc.followerCount,
                      0
                    );

                    return (
                      <div key={app.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{app.influencer.displayName}</h3>
                            <p className="text-sm text-gray-600">{app.influencer.user.email}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            app.isAccepted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {app.isAccepted ? '承認済み' : '待機中'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">フォロワー数</p>
                            <p className="font-semibold text-gray-900">{totalFollowers?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">提案価格</p>
                            <p className="font-semibold text-gray-900">
                              {app.proposedPrice ? `¥${app.proposedPrice.toLocaleString()}` : '提案なし'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">応募日</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(app.appliedAt).toLocaleDateString('ja-JP')}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-gray-500 text-xs mb-2">プラットフォーム</p>
                          <div className="flex flex-wrap gap-2">
                            {app.influencer.socialAccounts.map(acc => (
                              <span
                                key={acc.platform}
                                className={`inline-block text-xs px-2 py-1 rounded ${
                                  acc.isVerified
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {acc.platform}
                              </span>
                            ))}
                          </div>
                        </div>

                        <Link href={`/company/applications`}>
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            詳細を見る →
                          </button>
                        </Link>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            ) : (
              <p className="text-center py-8 text-gray-500">応募者がまだいません</p>
            )}
            </Card>
          </>
        )}

        {/* 提出物タブ */}
        {activeTab === 'submissions' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">提出物レビュー</h2>
            {submissionsLoading ? (
              <LoadingState />
            ) : submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map(submission => (
                  <div key={submission.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-md font-semibold text-gray-900 mb-1">
                          {submission.influencer?.displayName || 'インフルエンサー'}
                        </h4>
                        <p className="text-sm text-gray-600">{submission.influencer?.user?.email}</p>
                        <p className="text-sm text-gray-600">提出日時: {new Date(submission.submittedAt).toLocaleString('ja-JP')}</p>
                        <p className="text-sm text-gray-600">タイプ: {submission.submissionType}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSubmissionStatusBadgeColor(submission.status)}`}>
                        {getSubmissionStatusText(submission.status)}
                      </span>
                    </div>

                    {submission.submissionNotes && (
                      <div className="mb-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                        <strong>説明:</strong><br />{submission.submissionNotes}
                      </div>
                    )}

                    <div className="mb-4">
                      <a
                        href={submission.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                      >
                        提出物を表示 →
                      </a>
                    </div>

                    {submission.status === 'PENDING' && (
                      <div className="border-t border-gray-200 pt-4">
                        {showFeedbackForm === submission.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="フィードバックまたは修正理由を入力してください"
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveSubmission(submission.id)}
                                disabled={actionLoading === submission.id}
                                className="px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 text-sm"
                              >
                                {actionLoading === submission.id ? '処理中...' : '承認'}
                              </button>
                              <button
                                onClick={() => handleRequestRevision(submission.id)}
                                disabled={actionLoading === submission.id || !feedbackText.trim()}
                                className="px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 text-sm"
                              >
                                {actionLoading === submission.id ? '処理中...' : '修正要求'}
                              </button>
                              <button
                                onClick={() => handleRejectSubmission(submission.id)}
                                disabled={actionLoading === submission.id || !feedbackText.trim()}
                                className="px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 text-sm"
                              >
                                {actionLoading === submission.id ? '処理中...' : '却下'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowFeedbackForm(null);
                                  setFeedbackText('');
                                }}
                                className="px-3 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 text-sm"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowFeedbackForm(submission.id)}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors text-sm"
                          >
                            レビュー
                          </button>
                        )}
                      </div>
                    )}

                    {submission.approvalNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <strong className="text-blue-900 text-sm">フィードバック:</strong>
                        <p className="text-sm text-blue-800 mt-1">{submission.approvalNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">提出物がありません</p>
            )}
          </Card>
        )}

        {/* チャットタブ */}
        {activeTab === 'chat' && (
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">プロジェクトチャット</h2>
            <p className="text-gray-600 text-sm mb-4">
              マッチしたインフルエンサー（{project.matchedInfluencer?.displayName}）と進捗状況を確認できます。
            </p>
            <div className="border rounded-lg bg-gray-50 p-4 min-h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">メッセージはまだありません</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.id} className="text-sm">
                      <p className="font-semibold text-gray-900">{msg.senderName}</p>
                      <p className="text-gray-600 text-xs mb-1">{new Date(msg.createdAt).toLocaleString('ja-JP')}</p>
                      <p className="text-gray-800 bg-white p-2 rounded">{msg.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={async () => {
                    if (!messageText.trim()) return;
                    setSendingMessage(true);
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(`http://localhost:3001/api/messages`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          projectId: project.id,
                          content: messageText
                        })
                      });
                      if (response.ok) {
                        setMessageText('');
                      }
                    } catch (err) {
                      console.error('Error sending message:', err);
                    } finally {
                      setSendingMessage(false);
                    }
                  }}
                  disabled={sendingMessage || !messageText.trim()}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50"
                >
                  {sendingMessage ? '送信中...' : '送信'}
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* アクション */}
        <div className="flex gap-3">
          <Link href="/company/projects/list">
            <Button variant="secondary">一覧に戻る</Button>
          </Link>
          {project.status === 'PENDING' && (
            <Link href={`/company/projects/${project.id}/ai-matching`}>
              <Button variant="primary">AI マッチング</Button>
            </Link>
          )}
          {project.status === 'IN_PROGRESS' && (
            <button
              onClick={async () => {
                if (confirm('このプロジェクトを完了状態にしますか？')) {
                  try {
                    setCompleting(true);
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:3001/api/projects/${project.id}/status`, {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ status: 'COMPLETED' })
                    });
                    if (response.ok) {
                      alert('プロジェクトが完了状態に更新されました');
                      router.push('/company/projects/list');
                    } else {
                      setError('プロジェクトの完了に失敗しました');
                    }
                  } catch (err) {
                    setError('プロジェクトの完了処理中にエラーが発生しました');
                  } finally {
                    setCompleting(false);
                  }
                }
              }}
              disabled={completing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {completing ? '処理中...' : 'プロジェクト完了'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
