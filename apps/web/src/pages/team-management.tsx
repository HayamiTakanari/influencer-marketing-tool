import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import Sidebar from '../components/layout/Sidebar';
import { useErrorHandler } from '../hooks/useErrorHandler';

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
  const { handleError, handleSuccess } = useErrorHandler();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
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
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK' || err.message?.includes('getMyTeam is not a function')) {
        setTeam(null);
        setError('');
      } else {
        handleError(err, 'チーム情報の取得');
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
      await fetchTeamData();
    } catch (err: any) {
      handleError(err, 'チームの作成');
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
      await fetchTeamData();
    } catch (err: any) {
      handleError(err, 'チーム名の更新');
      if (err.code === 'ERR_NETWORK' || err.message?.includes('updateTeam is not a function')) {
        // ローカルでチーム名を更新
        setTeam({ ...team, name: teamName.trim() });
        setEditingTeam(false);
        setError(''); // エラーをクリア
      } else {
        setError('チーム名の更新に失敗しました。開発中の機能です。');
      }
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
      setError('');
    } catch (err: any) {
      handleError(err, 'メンバーの追加');
      setError('メンバーの追加に失敗しました。開発中の機能です。');
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
      setError('');
    } catch (err: any) {
      handleError(err, 'メンバーの削除');
      if (err.code === 'ERR_NETWORK' || err.message?.includes('removeTeamMember is not a function')) {
        // ローカルでメンバーを削除
        setTeam({ ...team, members: team.members.filter(m => m.id !== memberId) });
        setError('');
      } else {
        setError('メンバーの削除に失敗しました。開発中の機能です。');
      }
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
      setError('');
    } catch (err: any) {
      handleError(err, 'メンバーの役割更新');
      if (err.code === 'ERR_NETWORK' || err.message?.includes('updateMemberRole is not a function')) {
        // ローカルでメンバーの権限を更新
        const updatedMembers = team.members.map(m => 
          m.id === memberId ? { ...m, isOwner: !currentIsOwner } : m
        );
        setTeam({ ...team, members: updatedMembers });
        setError('');
      } else {
        setError('権限の更新に失敗しました。開発中の機能です。');
      }
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
      setError('');
    } catch (err: any) {
      handleError(err, 'チームの削除');
      if (err.code === 'ERR_NETWORK' || err.message?.includes('deleteTeam is not a function')) {
        // ローカルでチームを削除
        setTeam(null);
        setError('');
      } else {
        setError('チームの削除に失敗しました。開発中の機能です。');
      }
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* 背景デザイン */}
      <div className="fixed inset-0 z-0">
        {/* ベースグラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
        
        {/* メッシュグラデーション */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -inset-[100%] opacity-60">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #d1fae5, #10b981, transparent)' }} />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, #f3f4f6, #6b7280, transparent)' }} />
            <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #6ee7b7, #059669, transparent)' }} />
          </div>
        </div>
        
        {/* アーティスティックパターン */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="artistic-pattern-team" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern-team)" />
        </svg>
      </div>

      {/* サイドバー */}
      <Sidebar 
        user={user} 
        favoriteCount={0} 
        onLogout={handleLogout} 
      />

      {/* メインコンテンツエリア */}
      <div className="ml-80 relative z-10">
        {/* ナビゲーション */}
        <nav className="fixed top-0 left-80 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">チーム管理</h1>
                <p className="text-sm text-gray-600">チームメンバーの管理と権限設定</p>
              </div>
            </div>
          </div>
        </nav>

        <div className="pt-20 pb-12 px-4">
          <div className="max-w-7xl mx-auto">
        {/* 開発中のお知らせ */}
        <div


          className="relative bg-blue-50 border border-blue-200 px-4 py-3 mb-6" style={{
            background: `
              linear-gradient(135deg, transparent 10px, #eff6ff 10px),
              linear-gradient(-135deg, transparent 10px, #eff6ff 10px),
              linear-gradient(45deg, transparent 10px, #eff6ff 10px),
              linear-gradient(-45deg, transparent 10px, #eff6ff 10px)
            `,
            backgroundPosition: 'top left, top right, bottom right, bottom left',
            backgroundSize: '50% 50%',
            backgroundRepeat: 'no-repeat',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">🚧</span>
            <div>
              <p className="font-medium">開発中の機能です</p>
              <p className="text-sm">チーム管理機能は現在開発中です。一部の機能はモックデータで動作します。</p>
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div


            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6"
          >
            {error}
          </div>
        )}

        {!team ? (
          /* チーム作成 */
          <div



            className="relative bg-white border border-gray-200 p-8 transition-all overflow-hidden text-center" style={{
              background: `
                linear-gradient(135deg, transparent 10px, white 10px),
                linear-gradient(-135deg, transparent 10px, white 10px),
                linear-gradient(45deg, transparent 10px, white 10px),
                linear-gradient(-45deg, transparent 10px, white 10px)
              `,
              backgroundPosition: 'top left, top right, bottom right, bottom left',
              backgroundSize: '50% 50%',
              backgroundRepeat: 'no-repeat',
              boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
          >
            <div className="text-6xl mb-6">👥</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">チームを作成しましょう</h2>
            <p className="text-gray-600 mb-8">チームを作成して、複数のメンバーでプロジェクトを管理できます。</p>
            
            {!showCreateForm ? (
              <button


                onClick={() => setShowCreateForm(true)}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                チームを作成
              </button>
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
                  <button


                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {submitting ? '作成中...' : '作成'}
                  </button>
                  <button


                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* チーム情報 */}
            <div



              className="relative bg-white border border-gray-200 p-8 transition-all overflow-hidden mb-8" style={{
                background: `
                  linear-gradient(135deg, transparent 10px, white 10px),
                  linear-gradient(-135deg, transparent 10px, white 10px),
                  linear-gradient(45deg, transparent 10px, white 10px),
                  linear-gradient(-45deg, transparent 10px, white 10px)
                `,
                backgroundPosition: 'top left, top right, bottom right, bottom left',
                backgroundSize: '50% 50%',
                backgroundRepeat: 'no-repeat',
                boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  {!editingTeam ? (
                    <div className="flex items-center space-x-3">
                      <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
                      {currentUserIsOwner && (
                        <button


                          onClick={() => setEditingTeam(true)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          ✏️ 編集
                        </button>
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
                      <button


                        type="submit"
                        disabled={submitting}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {submitting ? '保存中...' : '保存'}
                      </button>
                      <button


                        type="button"
                        onClick={() => {
                          setEditingTeam(false);
                          setTeamName(team.name);
                        }}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        キャンセル
                      </button>
                    </form>
                  )}
                  <p className="text-gray-600 mt-2">作成日: {formatDate(team.createdAt)}</p>
                </div>
                <div className="flex space-x-3">
                  {currentUserIsOwner && (
                    <>
                      <button


                        onClick={() => setShowAddMemberForm(true)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        + メンバー追加
                      </button>
                      <button


                        onClick={handleDeleteTeam}
                        disabled={submitting}
                        className="px-4 py-2 border-2 border-red-300 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        チーム削除
                      </button>
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
            </div>

            {/* メンバー一覧 */}
            <div



              className="relative bg-white border border-gray-200 p-8 transition-all overflow-hidden" style={{
                background: `
                  linear-gradient(135deg, transparent 10px, white 10px),
                  linear-gradient(-135deg, transparent 10px, white 10px),
                  linear-gradient(45deg, transparent 10px, white 10px),
                  linear-gradient(-45deg, transparent 10px, white 10px)
                `,
                backgroundPosition: 'top left, top right, bottom right, bottom left',
                backgroundSize: '50% 50%',
                backgroundRepeat: 'no-repeat',
                boxShadow: '6px 6px 15px rgba(0,0,0,0.1), 3px 3px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
              }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">チームメンバー</h3>
              
              <div className="space-y-4">
                {team.members.map((member, index) => (
                  <div
                    key={member.id}



                    className="relative bg-white flex items-center justify-between p-4 border border-gray-200 transition-all hover:shadow-md" style={{
                      boxShadow: '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}
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
                        <button


                          onClick={() => handleToggleOwner(member.id, member.isOwner, member.user.email)}
                          disabled={processing === member.id}
                          className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${
                            member.isOwner
                              ? 'border border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                              : 'bg-yellow-500 text-white hover:bg-yellow-600'
                          }`}
                        >
                          {processing === member.id ? '処理中...' : member.isOwner ? '管理者解除' : '管理者に昇格'}
                        </button>
                        <button


                          onClick={() => handleRemoveMember(member.id, member.user.email)}
                          disabled={processing === member.id}
                          className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* メンバー追加フォーム */}
        {showAddMemberForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div


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

                <button


                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '追加中...' : 'メンバーを追加'}
                </button>
              </form>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementPage;