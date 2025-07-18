import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { 
  createProjectSchedule,
  getProjectSchedule,
  updateMilestone,
  getUpcomingMilestones,
  ProjectSchedule,
  Milestone
} from '../services/v3-api';
import { getMyProjects } from '../services/api';

const ProjectSchedulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'create' | 'manage'>('upcoming');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [schedule, setSchedule] = useState<ProjectSchedule | null>(null);
  const [upcomingMilestones, setUpcomingMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  const [scheduleForm, setScheduleForm] = useState({
    projectId: '',
    publishDate: '',
    milestones: [
      {
        type: 'CONCEPT_APPROVAL' as const,
        title: '構成案承認',
        description: '企画内容の承認を得る',
        dueDate: '',
      },
      {
        type: 'VIDEO_COMPLETION' as const,
        title: '動画完成',
        description: '動画制作を完了する',
        dueDate: '',
      },
      {
        type: 'FINAL_APPROVAL' as const,
        title: '最終承認',
        description: '最終コンテンツの承認を得る',
        dueDate: '',
      },
    ],
  });

  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    isCompleted: false,
  });

  const milestoneTypeLabels = {
    CONCEPT_APPROVAL: '構成案承認',
    VIDEO_COMPLETION: '動画完成',
    FINAL_APPROVAL: '最終承認',
    PUBLISH_DATE: '投稿日',
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsData, upcomingData] = await Promise.all([
        getMyProjects(),
        getUpcomingMilestones(7)
      ]);
      
      setProjects(projectsData.projects || []);
      setUpcomingMilestones(upcomingData.milestones || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectSchedule = async (projectId: string) => {
    try {
      const data = await getProjectSchedule(projectId);
      setSchedule(data.schedule);
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setSchedule(null);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setSuccessMessage('');
      
      // 投稿日から逆算してマイルストーンの日付を自動設定
      const publishDate = new Date(scheduleForm.publishDate);
      const milestones = scheduleForm.milestones.map((milestone, index) => {
        const dueDate = new Date(publishDate);
        dueDate.setDate(publishDate.getDate() - (3 - index) * 3); // 3日間隔で逆算
        
        return {
          ...milestone,
          dueDate: dueDate.toISOString(),
        };
      });

      const submitData = {
        projectId: scheduleForm.projectId,
        publishDate: scheduleForm.publishDate,
        milestones,
      };

      await createProjectSchedule(submitData);
      setShowCreateModal(false);
      setSuccessMessage('スケジュールを作成しました！');
      setActiveTab('manage');
      fetchData();
      fetchProjectSchedule(scheduleForm.projectId);
      
      // 3秒後にメッセージを消去
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error creating schedule:', err);
      setError('スケジュールの作成に失敗しました。');
    }
  };

  const handleUpdateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;

    try {
      setError('');
      setSuccessMessage('');
      
      const submitData = {
        ...milestoneForm,
        dueDate: milestoneForm.dueDate ? new Date(milestoneForm.dueDate).toISOString() : undefined,
      };

      await updateMilestone(editingMilestone.id, submitData);
      setShowEditModal(false);
      setEditingMilestone(null);
      setSuccessMessage('マイルストーンを更新しました！');
      
      if (selectedProject) {
        fetchProjectSchedule(selectedProject.id);
      }
      fetchData();
      
      // 3秒後にメッセージを消去
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error updating milestone:', err);
      setError('マイルストーンの更新に失敗しました。');
    }
  };

  const openEditModal = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description || '',
      dueDate: milestone.dueDate.split('T')[0],
      isCompleted: milestone.isCompleted,
    });
    setShowEditModal(true);
  };

  const calculateDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueDateColor = (dueDate: string, isCompleted: boolean) => {
    if (isCompleted) return 'text-green-600';
    
    const daysUntil = calculateDaysUntilDue(dueDate);
    if (daysUntil < 0) return 'text-red-600';
    if (daysUntil <= 1) return 'text-orange-600';
    return 'text-gray-600';
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      projectId: '',
      publishDate: '',
      milestones: [
        {
          type: 'CONCEPT_APPROVAL',
          title: '構成案承認',
          description: '企画内容の承認を得る',
          dueDate: '',
        },
        {
          type: 'VIDEO_COMPLETION',
          title: '動画完成',
          description: '動画制作を完了する',
          dueDate: '',
        },
        {
          type: 'FINAL_APPROVAL',
          title: '最終承認',
          description: '最終コンテンツの承認を得る',
          dueDate: '',
        },
      ],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            プロジェクトスケジュール
          </motion.h1>
          {(user?.role === 'CLIENT' || user?.role === 'COMPANY') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetScheduleForm();
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              新規スケジュール作成
            </motion.button>
          )}
        </div>

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

        {/* 成功メッセージ */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center space-x-2"
          >
            <span className="text-xl">✅</span>
            <span>{successMessage}</span>
          </motion.div>
        )}

        {/* タブ */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            今後の予定
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'manage'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            スケジュール管理
          </button>
        </div>

        {/* 今後の予定タブ */}
        {activeTab === 'upcoming' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">今後7日間の予定</h2>
            
            {upcomingMilestones.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">今後7日間の予定はありません。</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMilestones.map((milestone) => {
                  const daysUntil = calculateDaysUntilDue(milestone.dueDate);
                  const isOverdue = daysUntil < 0;
                  const isToday = daysUntil === 0;
                  const isTomorrow = daysUntil === 1;

                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border-l-4 ${
                        isOverdue ? 'border-red-500' : 
                        isToday ? 'border-orange-500' : 
                        isTomorrow ? 'border-yellow-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
                          <p className="text-gray-600">{milestone.schedule.project.title}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${getDueDateColor(milestone.dueDate, milestone.isCompleted)}`}>
                            {isOverdue ? `${Math.abs(daysUntil)}日遅れ` :
                             isToday ? '今日期限' :
                             isTomorrow ? '明日期限' :
                             `あと${daysUntil}日`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {milestone.description && (
                        <p className="text-gray-700 mb-3">{milestone.description}</p>
                      )}

                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          milestone.isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {milestoneTypeLabels[milestone.type as keyof typeof milestoneTypeLabels]}
                        </span>
                        
                        {!milestone.isCompleted && (
                          <button
                            onClick={() => openEditModal(milestone)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            編集
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* スケジュール管理タブ */}
        {activeTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">プロジェクト選択</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedProject(project);
                    fetchProjectSchedule(project.id);
                  }}
                  className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg cursor-pointer transition-all ${
                    selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.status === 'IN_PROGRESS' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedProject && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {selectedProject.title} のスケジュール
                </h3>

                {schedule ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                      <h4 className="font-semibold text-blue-800 mb-2">投稿予定日</h4>
                      <p className="text-blue-700 text-lg">
                        {new Date(schedule.publishDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {schedule.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                            milestone.isCompleted 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${
                              milestone.isCompleted 
                                ? 'bg-green-500' 
                                : 'bg-gray-300'
                            }`}></div>
                            <div>
                              <p className="font-medium text-gray-800">{milestone.title}</p>
                              {milestone.description && (
                                <p className="text-sm text-gray-600">{milestone.description}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-sm font-medium ${getDueDateColor(milestone.dueDate, milestone.isCompleted)}`}>
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                            <button
                              onClick={() => openEditModal(milestone)}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-1 transition-colors"
                            >
                              編集
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">このプロジェクトにはまだスケジュールが作成されていません。</p>
                    {(user?.role === 'CLIENT' || user?.role === 'COMPANY') && (
                      <button
                        onClick={() => {
                          setScheduleForm({...scheduleForm, projectId: selectedProject.id});
                          setShowCreateModal(true);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        スケジュールを作成
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* スケジュール作成モーダル */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">スケジュール作成</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト *
                </label>
                <select
                  value={scheduleForm.projectId}
                  onChange={(e) => setScheduleForm({...scheduleForm, projectId: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">プロジェクトを選択してください</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  投稿予定日 *
                </label>
                <input
                  type="date"
                  value={scheduleForm.publishDate}
                  onChange={(e) => setScheduleForm({...scheduleForm, publishDate: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  マイルストーン（投稿日から自動逆算されます）
                </label>
                <div className="space-y-4">
                  {scheduleForm.milestones.map((milestone, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            タイトル
                          </label>
                          <input
                            type="text"
                            value={milestone.title}
                            onChange={(e) => {
                              const updated = [...scheduleForm.milestones];
                              updated[index] = {...updated[index], title: e.target.value};
                              setScheduleForm({...scheduleForm, milestones: updated});
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            説明
                          </label>
                          <input
                            type="text"
                            value={milestone.description}
                            onChange={(e) => {
                              const updated = [...scheduleForm.milestones];
                              updated[index] = {...updated[index], description: e.target.value};
                              setScheduleForm({...scheduleForm, milestones: updated});
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  作成
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* マイルストーン編集モーダル */}
      {showEditModal && editingMilestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">マイルストーン編集</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMilestone(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateMilestone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  期限日
                </label>
                <input
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) => setMilestoneForm({...milestoneForm, dueDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={milestoneForm.isCompleted}
                  onChange={(e) => setMilestoneForm({...milestoneForm, isCompleted: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">完了</label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMilestone(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  更新
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ProjectSchedulePage;