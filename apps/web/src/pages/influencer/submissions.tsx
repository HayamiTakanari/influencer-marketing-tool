import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import LoadingState from '../../components/common/LoadingState';

interface Project {
  id: string;
  title: string;
  status: string;
  budget: number;
  client?: {
    companyName?: string;
    user?: {
      email: string;
    };
  };
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
  project?: Project;
}

const InfluencerSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionType, setSubmissionType] = useState('video');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch matched projects
      const projectsRes = await fetch('http://localhost:3001/api/projects/matched', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(Array.isArray(projectsData) ? projectsData : (projectsData.projects || []));
      }

      // Fetch submissions
      const submissionsRes = await fetch('http://localhost:3001/api/submissions/influencer/my-submissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
        setError('');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !submissionUrl) {
      setError('プロジェクトとURLを入力してください');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/submissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          submissionUrl,
          submissionType,
          submissionNotes
        })
      });

      if (response.ok) {
        setSuccessMessage('提出物が正常にアップロードされました');
        setSelectedProjectId('');
        setSubmissionUrl('');
        setSubmissionType('video');
        setSubmissionNotes('');
        setShowUploadForm(false);
        setTimeout(() => {
          setSuccessMessage('');
          fetchData();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '提出に失敗しました');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('提出処理中にエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REVISION_REQUESTED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
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
      <DashboardLayout title="提出物管理" subtitle="プロジェクトの提出物を管理">
        <LoadingState />
      </DashboardLayout>
    );
  }

  const inProgressProjects = projects.filter(p => p.status === 'IN_PROGRESS');

  return (
    <DashboardLayout title="提出物管理" subtitle="プロジェクトの提出物を管理">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            {successMessage}
          </div>
        )}

        {!showUploadForm ? (
          <div className="mb-6">
            {inProgressProjects.length > 0 && (
              <button
                onClick={() => setShowUploadForm(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
              >
                + 新しい提出物
              </button>
            )}
          </div>
        ) : (
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">提出物をアップロード</h3>
            <form onSubmit={handleSubmitContent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">プロジェクトを選択</option>
                  {inProgressProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提出物のタイプ
                </label>
                <select
                  value={submissionType}
                  onChange={(e) => setSubmissionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="video">動画</option>
                  <option value="image">画像</option>
                  <option value="post">投稿</option>
                  <option value="content">コンテンツ</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提出物のURL
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://example.com/content"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メモ（オプション）
                </label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="提出物について補足説明があれば入力してください"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {uploading ? '提出中...' : '提出する'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </Card>
        )}

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">提出履歴</h3>

          {submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map(submission => (
                <Card key={submission.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-md font-semibold text-gray-900 mb-1">
                        {submission.project?.title || 'プロジェクト'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        提出日時: {new Date(submission.submittedAt).toLocaleString('ja-JP')}
                      </p>
                      <p className="text-sm text-gray-600">
                        タイプ: {submission.submissionType}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeColor(submission.status)}`}>
                      {getStatusText(submission.status)}
                    </span>
                  </div>

                  {submission.submissionNotes && (
                    <div className="mb-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
                      <strong>提出時の説明:</strong><br />
                      {submission.submissionNotes}
                    </div>
                  )}

                  <a
                    href={submission.submissionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  >
                    提出物を表示 →
                  </a>

                  {submission.approvalNotes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <strong className="text-blue-900 text-sm">フィードバック:</strong>
                      <p className="text-sm text-blue-800 mt-1">{submission.approvalNotes}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="text-center py-8">
                <p className="text-gray-500">まだ提出物がありません</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InfluencerSubmissionsPage;
