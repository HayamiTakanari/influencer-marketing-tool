import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface TeamMember {
  id: string;
  isOwner: boolean;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
}

interface Team {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  clients: {
    id: string;
    companyName: string;
    user: {
      id: string;
      email: string;
    };
  }[];
}

const TeamManagementPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberIsOwner, setMemberIsOwner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      fetchTeamData();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchTeamData = async () => {
    try {
      const { getMyTeam } = await import('../services/api');
      const result = await getMyTeam();
      setTeam(result);
      if (result) {
        setTeamName(result.name);
      }
    } catch (err: any) {
      console.error('Error fetching team data:', err);
      if (err.response?.status === 404) {
        // No team exists yet
        setTeam(null);
      } else {
        setError('チーム情報の取得に失敗しました。');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    
    setSubmitting(true);
    try {
      const { createTeam } = await import('../services/api');
      const newTeam = await createTeam({ name: teamName.trim() });
      setTeam(newTeam);
      setShowCreateForm(false);
      setTeamName(newTeam.name);
      // アラートを削除して、直接データをフェッチし直す
      await fetchTeamData();
    } catch (err: any) {
      console.error('Error creating team:', err);
      setError('チームの作成に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !teamName.trim()) return;
    
    setSubmitting(true);
    try {
      const { updateTeam } = await import('../services/api');
      const updatedTeam = await updateTeam(team.id, { name: teamName.trim() });
      setTeam(updatedTeam);
      setEditingTeam(false);
      // 更新成功後に再フェッチ
      await fetchTeamData();
    } catch (err: any) {
      console.error('Error updating team:', err);
      setError('チーム名の更新に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !memberEmail.trim()) return;
    
    setSubmitting(true);
    try {
      const { addTeamMember } = await import('../services/api');
      await addTeamMember(team.id, { 
        email: memberEmail.trim(), 
        isOwner: memberIsOwner 
      });
      await fetchTeamData();
      setShowAddMemberForm(false);
      setMemberEmail('');
      setMemberIsOwner(false);
      alert('メンバーが追加されました！');
    } catch (err: any) {
      console.error('Error adding member:', err);
      alert(err.response?.data?.error || 'メンバーの追加に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!team || !confirm(`${memberEmail} をチームから削除しますか？`)) return;
    
    setProcessing(memberId);
    try {
      const { removeTeamMember } = await import('../services/api');
      await removeTeamMember(team.id, memberId);
      await fetchTeamData();
      alert('メンバーが削除されました。');
    } catch (err: any) {
      console.error('Error removing member:', err);
      alert(err.response?.data?.error || 'メンバーの削除に失敗しました。');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleOwner = async (memberId: string, currentIsOwner: boolean, memberEmail: string) => {
    if (!team) return;
    
    const action = currentIsOwner ? '管理者権限を削除' : '管理者権限を付与';
    if (!confirm(`${memberEmail} に${action}しますか？`)) return;
    
    setProcessing(memberId);
    try {
      const { updateMemberRole } = await import('../services/api');
      await updateMemberRole(team.id, memberId, { isOwner: !currentIsOwner });
      await fetchTeamData();
      alert(`${action}しました。`);
    } catch (err: any) {
      console.error('Error updating member role:', err);
      alert(err.response?.data?.error || '権限の更新に失敗しました。');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team || !confirm('チームを削除しますか？この操作は取り消せません。')) return;
    
    setSubmitting(true);
    try {
      const { deleteTeam } = await import('../services/api');
      await deleteTeam(team.id);
      setTeam(null);
      alert('チームが削除されました。');
    } catch (err: any) {
      console.error('Error deleting team:', err);
      alert(err.response?.data?.error || 'チームの削除に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserOwner = (userId: string) => {
    return team?.members.find(m => m.user.id === userId)?.isOwner || false;
  };

  const currentUserIsOwner = user ? isUserOwner(user.id) : false;

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
              <h1 className="text-xl font-bold text-gray-900">チーム管理</h1>
              <p className="text-sm text-gray-600">チームメンバーの管理と権限設定</p>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
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

        {!team ? (
          /* チーム作成 */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl text-center"
          >
            <div className="text-6xl mb-6">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">チームを作成しましょう</h2>
            <p className="text-gray-600 mb-8">チームを作成して、複数のメンバーでプロジェクトを管理できます。</p>
            
            {!showCreateForm ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                チームを作成
              </motion.button>
            ) : (
              <form onSubmit={handleCreateTeam} className="max-w-md mx-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    チーム名
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例: マーケティングチーム"
                  />
                </div>
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {submitting ? '作成中...' : '作成'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        ) : (
          <>
            {/* チーム情報 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  {!editingTeam ? (
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
                      {currentUserIsOwner && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingTeam(true)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ✏️ 編集
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateTeam} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={submitting}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {submitting ? '保存中...' : '保存'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          setEditingTeam(false);
                          setTeamName(team.name);
                        }}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        キャンセル
                      </motion.button>
                    </form>
                  )}
                  <p className="text-gray-600 mt-2">作成日: {formatDate(team.createdAt)}</p>
                </div>
                <div className="flex space-x-3">
                  {currentUserIsOwner && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddMemberForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        + メンバー追加
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDeleteTeam}
                        disabled={submitting}
                        className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        チーム削除
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{team.members.length}</div>
                  <div className="text-blue-800">メンバー数</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {team.members.filter(m => m.isOwner).length}
                  </div>
                  <div className="text-green-800">管理者数</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {team.clients.length}
                  </div>
                  <div className="text-purple-800">関連クライアント</div>
                </div>
              </div>
            </motion.div>

            {/* メンバー一覧 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">チームメンバー</h3>
              
              <div className="space-y-4">
                {team.members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">
                          {member.user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{member.user.email}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            member.isOwner 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.isOwner ? '👑 管理者' : '👤 メンバー'}
                          </span>
                          <span className="text-gray-500 text-sm">
                            参加: {formatDate(member.joinedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {currentUserIsOwner && member.user.id !== user.id && (
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleToggleOwner(member.id, member.isOwner, member.user.email)}
                          disabled={processing === member.id}
                          className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${
                            member.isOwner
                              ? 'border border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                              : 'bg-yellow-500 text-white hover:bg-yellow-600'
                          }`}
                        >
                          {processing === member.id ? '処理中...' : member.isOwner ? '管理者解除' : '管理者に昇格'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemoveMember(member.id, member.user.email)}
                          disabled={processing === member.id}
                          className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          削除
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* メンバー追加フォーム */}
        {showAddMemberForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full relative"
            >
              <button
                onClick={() => {
                  setShowAddMemberForm(false);
                  setMemberEmail('');
                  setMemberIsOwner(false);
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-center">メンバーを追加</h2>
              
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="member@example.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOwner"
                    checked={memberIsOwner}
                    onChange={(e) => setMemberIsOwner(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isOwner" className="text-sm text-gray-700">
                    管理者権限を付与する
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '追加中...' : 'メンバーを追加'}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagementPage;