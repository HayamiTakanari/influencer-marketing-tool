import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Review {
  id: string;
  projectId: string;
  rating: number;
  comment?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    email: string;
  };
  reviewee: {
    email: string;
  };
  project: {
    title: string;
    category: string;
  };
  influencer?: {
    displayName: string;
  };
  client?: {
    companyName: string;
  };
}

interface ReviewableProject {
  id: string;
  title: string;
  category: string;
  status: string;
  updatedAt: string;
  matchedInfluencer?: {
    displayName: string;
    user: {
      email: string;
    };
  };
  client?: {
    companyName: string;
    user: {
      email: string;
    };
  };
}

const ReviewsPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [reviewableProjects, setReviewableProjects] = useState<ReviewableProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'received' | 'given' | 'reviewable'>('received');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ReviewableProject | null>(null);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    isPublic: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchData();
    } else {
      router.push('/login');
    }
  }, [router, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'reviewable') {
        await fetchReviewableProjects();
      } else {
        await fetchMyReviews();
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const { getMyReviews } = await import('../services/api');
      const data = await getMyReviews(activeTab as 'given' | 'received');
      setMyReviews(data.reviews || []);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      throw err;
    }
  };

  const fetchReviewableProjects = async () => {
    try {
      const { getReviewableProjects } = await import('../services/api');
      const data = await getReviewableProjects();
      setReviewableProjects(data || []);
    } catch (err: any) {
      console.error('Error fetching reviewable projects:', err);
      throw err;
    }
  };

  const handleCreateReview = async () => {
    if (!selectedProject) return;

    setSubmitting(true);
    try {
      const { createReview } = await import('../services/api');
      await createReview({
        projectId: selectedProject.id,
        rating: newReview.rating,
        comment: newReview.comment || undefined,
        isPublic: newReview.isPublic,
      });

      setShowCreateModal(false);
      setSelectedProject(null);
      setNewReview({ rating: 5, comment: '', isPublic: true });
      
      // Refresh data
      await fetchData();
      
      alert('レビューを投稿しました！');
    } catch (err: any) {
      console.error('Error creating review:', err);
      alert('レビューの投稿に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateModal = (project: ReviewableProject) => {
    setSelectedProject(project);
    setShowCreateModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < rating;
      return (
        <span
          key={i}
          className={`text-xl ${
            filled ? 'text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={interactive ? () => setNewReview(prev => ({ ...prev, rating: i + 1 })) : undefined}
        >
          ⭐
        </span>
      );
    });
  };

  const renderReceivedTab = () => (
    <div className="space-y-4">
      {myReviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">受信したレビューがありません</h3>
          <p className="text-gray-600">プロジェクトが完了すると、クライアントからレビューが届きます。</p>
        </div>
      ) : (
        myReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{review.project.title}</h3>
                <p className="text-sm text-gray-600">{review.project.category}</p>
                <div className="flex items-center mt-2">
                  {renderStars(review.rating)}
                  <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{formatDate(review.createdAt)}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'INFLUENCER' ? review.client?.companyName : review.influencer?.displayName}
                </p>
              </div>
            </div>
            {review.comment && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700">{review.comment}</p>
              </div>
            )}
            {!review.isPublic && (
              <div className="mt-3">
                <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-lg">
                  非公開
                </span>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const renderGivenTab = () => (
    <div className="space-y-4">
      {myReviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">投稿したレビューがありません</h3>
          <p className="text-gray-600">完了したプロジェクトについてレビューを投稿してみましょう。</p>
        </div>
      ) : (
        myReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{review.project.title}</h3>
                <p className="text-sm text-gray-600">{review.project.category}</p>
                <div className="flex items-center mt-2">
                  {renderStars(review.rating)}
                  <span className="ml-2 text-sm text-gray-600">({review.rating}/5)</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{formatDate(review.createdAt)}</p>
                <p className="text-xs text-gray-500">
                  レビュー対象: {user.role === 'CLIENT' ? review.influencer?.displayName : review.client?.companyName}
                </p>
              </div>
            </div>
            {review.comment && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700">{review.comment}</p>
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <div>
                {!review.isPublic && (
                  <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-lg">
                    非公開
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  編集
                </button>
                <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  削除
                </button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderReviewableTab = () => (
    <div className="space-y-4">
      {reviewableProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">レビュー可能なプロジェクトがありません</h3>
          <p className="text-gray-600">完了したプロジェクトがあると、ここに表示されレビューを投稿できます。</p>
        </div>
      ) : (
        reviewableProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{project.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{project.category}</p>
                <p className="text-xs text-gray-500">
                  完了日: {formatDate(project.updatedAt)}
                </p>
                <p className="text-xs text-gray-500">
                  {user.role === 'CLIENT' 
                    ? `インフルエンサー: ${project.matchedInfluencer?.displayName}`
                    : `クライアント: ${project.client?.companyName}`
                  }
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openCreateModal(project)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                レビューを書く
              </motion.button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">IM</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">レビュー</h1>
              <p className="text-sm text-gray-600">評価とフィードバック</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email}</span>
            <Link href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors">
              ダッシュボード
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* エラーメッセージ */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* タブ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-8"
        >
          <div className="flex gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'received'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              受信したレビュー
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('given')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'given'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              投稿したレビュー
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('reviewable')}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === 'reviewable'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              レビューを書く
            </motion.button>
          </div>
        </motion.div>

        {/* コンテンツ */}
        {activeTab === 'received' && renderReceivedTab()}
        {activeTab === 'given' && renderGivenTab()}
        {activeTab === 'reviewable' && renderReviewableTab()}
      </div>

      {/* レビュー作成モーダル */}
      {showCreateModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">レビューを投稿</h2>
            
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-1">{selectedProject.title}</h3>
              <p className="text-sm text-gray-600">{selectedProject.category}</p>
              <p className="text-sm text-gray-600">
                {user.role === 'CLIENT' 
                  ? `インフルエンサー: ${selectedProject.matchedInfluencer?.displayName}`
                  : `クライアント: ${selectedProject.client?.companyName}`
                }
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                評価
              </label>
              <div className="flex items-center">
                {renderStars(newReview.rating, true)}
                <span className="ml-2 text-sm text-gray-600">({newReview.rating}/5)</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                コメント（任意）
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="プロジェクトの感想やフィードバックを入力してください..."
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newReview.isPublic}
                  onChange={(e) => setNewReview(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">このレビューを公開する</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateReview}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {submitting ? '投稿中...' : '投稿する'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;