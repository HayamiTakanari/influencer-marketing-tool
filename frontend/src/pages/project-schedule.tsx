import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { getMyProjects, getProjectSchedule } from '../services/api';

type PhaseType = 
  | 'FORMAL_REQUEST'
  | 'PRODUCT_RECEIPT' 
  | 'DRAFT_CREATION'
  | 'DRAFT_SUBMISSION'
  | 'SCRIPT_FEEDBACK'
  | 'SCRIPT_REVISION'
  | 'SCRIPT_FINALIZE'
  | 'SHOOTING_PERIOD'
  | 'VIDEO_DRAFT_SUBMIT'
  | 'VIDEO_FEEDBACK'
  | 'VIDEO_REVISION'
  | 'VIDEO_FINAL_SUBMIT'
  | 'VIDEO_FINALIZE'
  | 'POSTING_PERIOD'
  | 'INSIGHT_SUBMIT';

interface Phase {
  id: string;
  type: PhaseType;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  isDateRange: boolean;
  color: string;
  icon: string;
}

interface ProjectSchedule {
  phases: Phase[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  clientId: string;
  matchedInfluencerId?: string;
}

const PHASE_CONFIG: Record<PhaseType, { title: string; description: string; color: string; icon: string; isDateRange: boolean }> = {
  FORMAL_REQUEST: { title: '正式依頼', description: 'プロジェクトの正式依頼日', color: 'bg-blue-500', icon: '📄', isDateRange: false },
  PRODUCT_RECEIPT: { title: '商品受領', description: 'PR商品の受領日', color: 'bg-green-500', icon: '📦', isDateRange: false },
  DRAFT_CREATION: { title: '構成案作成', description: '企画書・構成案の作成期間', color: 'bg-purple-500', icon: '✏️', isDateRange: true },
  DRAFT_SUBMISSION: { title: '構成案提出', description: '企画書・構成案の提出日', color: 'bg-indigo-500', icon: '📝', isDateRange: false },
  SCRIPT_FEEDBACK: { title: '台本フィードバック', description: '台本に対するフィードバック期間', color: 'bg-yellow-500', icon: '💬', isDateRange: true },
  SCRIPT_REVISION: { title: '台本修正', description: '台本の修正・改善期間', color: 'bg-orange-500', icon: '🔄', isDateRange: true },
  SCRIPT_FINALIZE: { title: '台本確定', description: '最終台本の確定日', color: 'bg-red-500', icon: '✅', isDateRange: false },
  SHOOTING_PERIOD: { title: '撮影期間', description: 'コンテンツ撮影期間', color: 'bg-pink-500', icon: '🎥', isDateRange: true },
  VIDEO_DRAFT_SUBMIT: { title: '動画初稿提出', description: '編集した動画の初稿提出日', color: 'bg-teal-500', icon: '🎬', isDateRange: false },
  VIDEO_FEEDBACK: { title: '動画フィードバック', description: '動画に対するフィードバック期間', color: 'bg-cyan-500', icon: '📹', isDateRange: true },
  VIDEO_REVISION: { title: '動画修正', description: '動画の修正・再編集期間', color: 'bg-emerald-500', icon: '🎞️', isDateRange: true },
  VIDEO_FINAL_SUBMIT: { title: '動画最終提出', description: '最終動画の提出日', color: 'bg-lime-500', icon: '💾', isDateRange: false },
  VIDEO_FINALIZE: { title: '動画確定', description: '最終動画の確定日', color: 'bg-amber-500', icon: '🎯', isDateRange: false },
  POSTING_PERIOD: { title: '投稿期間', description: 'SNS投稿期間', color: 'bg-rose-500', icon: '📱', isDateRange: true },
  INSIGHT_SUBMIT: { title: 'インサイト提出', description: '投稿結果・インサイトデータの提出日', color: 'bg-violet-500', icon: '📊', isDateRange: false }
};

const ProjectSchedulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'project' | 'overview'>('project');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [projects, setProjects] = useState<Project[]>([]);
  const [schedules, setSchedules] = useState<{ [key: string]: ProjectSchedule }>({});
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectsData = await getMyProjects();
      const projectList = projectsData.projects || [];
      setProjects(projectList);

      if (projectList.length > 0) {
        setSelectedProject(projectList[0].id);
        await fetchSchedules(projectList);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (projectList: Project[]) => {
    const scheduleData: { [key: string]: ProjectSchedule } = {};
    
    for (const project of projectList) {
      try {
        const schedule = await getProjectSchedule(project.id);
        if (schedule && schedule.phases) {
          scheduleData[project.id] = schedule;
        } else {
          scheduleData[project.id] = generateMockSchedule(project);
        }
      } catch (error) {
        console.error(`Error fetching schedule for project ${project.id}:`, error);
        scheduleData[project.id] = generateMockSchedule(project);
      }
    }
    
    setSchedules(scheduleData);
  };

  const generateMockSchedule = (project: Project): ProjectSchedule => {
    const startDate = new Date();
    const phases: Phase[] = [];
    
    const phaseTypes: PhaseType[] = [
      'FORMAL_REQUEST', 'PRODUCT_RECEIPT', 'DRAFT_CREATION', 'DRAFT_SUBMISSION',
      'SCRIPT_FEEDBACK', 'SCRIPT_REVISION', 'SCRIPT_FINALIZE', 'SHOOTING_PERIOD',
      'VIDEO_DRAFT_SUBMIT', 'VIDEO_FEEDBACK', 'VIDEO_REVISION', 'VIDEO_FINAL_SUBMIT',
      'VIDEO_FINALIZE', 'POSTING_PERIOD', 'INSIGHT_SUBMIT'
    ];

    phaseTypes.forEach((type, index) => {
      const config = PHASE_CONFIG[type];
      const phaseStartDate = new Date(startDate);
      phaseStartDate.setDate(startDate.getDate() + index * 3);
      
      let endDate = undefined;
      if (config.isDateRange) {
        const phaseEndDate = new Date(phaseStartDate);
        phaseEndDate.setDate(phaseStartDate.getDate() + 2);
        endDate = phaseEndDate.toISOString();
      }

      phases.push({
        id: `${project.id}-phase-${index}`,
        type,
        title: config.title,
        description: config.description,
        startDate: phaseStartDate.toISOString(),
        endDate,
        status: index === 0 ? 'in_progress' : 'pending',
        isDateRange: config.isDateRange,
        color: config.color,
        icon: config.icon
      });
    });

    return {
      phases,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const getProjectBorderColor = (schedule: ProjectSchedule) => {
    const projectIndex = Object.values(schedules).indexOf(schedule);
    const borderColors = [
      'border-l-blue-500', 'border-l-emerald-500', 'border-l-purple-500', 'border-l-orange-500',
      'border-l-pink-500', 'border-l-teal-500', 'border-l-indigo-500', 'border-l-red-500'
    ];
    return borderColors[projectIndex % borderColors.length];
  };

  const getProjectTextColor = (schedule: ProjectSchedule) => {
    const projectIndex = Object.values(schedules).indexOf(schedule);
    const textColors = [
      'text-blue-600', 'text-emerald-600', 'text-purple-600', 'text-orange-600',
      'text-pink-600', 'text-teal-600', 'text-indigo-600', 'text-red-600'
    ];
    return textColors[projectIndex % textColors.length];
  };

  const getAllPhases = () => {
    const allPhases: Array<Phase & { projectId: string; projectTitle: string }> = [];
    
    projects.forEach(project => {
      const schedule = schedules[project.id];
      if (schedule && schedule.phases) {
        schedule.phases.forEach(phase => {
          allPhases.push({
            ...phase,
            projectId: project.id,
            projectTitle: project.title
          });
        });
      }
    });

    return allPhases.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            再試行
          </button>
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
        </div>

        {/* タブとビューモード */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('project')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'project'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              プロジェクト別
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              全体スケジュール
            </button>
          </div>

          <div className="flex space-x-2 bg-white/80 rounded-xl p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📅 カレンダー
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 リスト
            </button>
          </div>
        </div>

        {/* プロジェクト別タブ */}
        {activeTab === 'project' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* プロジェクト選択 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProject(project.id)}
                  className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg cursor-pointer transition-all ${
                    selectedProject === project.id ? 'ring-2 ring-blue-500' : ''
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

            {/* 選択されたプロジェクトのスケジュール */}
            {selectedProject && schedules[selectedProject] && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {projects.find(p => p.id === selectedProject)?.title} のスケジュール
                </h3>

                {viewMode === 'calendar' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schedules[selectedProject].phases.map((phase) => (
                      <motion.div
                        key={phase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${phase.color} rounded-xl p-4 text-white shadow-lg`}
                      >
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">{phase.icon}</span>
                          <h4 className="font-bold text-lg">{phase.title}</h4>
                        </div>
                        <p className="text-sm opacity-90 mb-3">{phase.description}</p>
                        <div className="text-sm">
                          <p className="font-medium">
                            {formatDate(phase.startDate)}
                            {phase.endDate && ` - ${formatDate(phase.endDate)}`}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                            phase.status === 'completed' ? 'bg-green-200 text-green-800' :
                            phase.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-gray-200 text-gray-800'
                          }`}>
                            {phase.status === 'completed' ? '完了' :
                             phase.status === 'in_progress' ? '進行中' : '待機中'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules[selectedProject].phases.map((phase) => (
                      <motion.div
                        key={phase.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            phase.status === 'completed' ? 'bg-green-500' :
                            phase.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-2xl">{phase.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800">{phase.title}</p>
                            <p className="text-sm text-gray-600">{phase.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">
                            {formatDate(phase.startDate)}
                            {phase.endDate && ` - ${formatDate(phase.endDate)}`}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                            phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                            phase.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {phase.status === 'completed' ? '完了' :
                             phase.status === 'in_progress' ? '進行中' : '待機中'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* 全体スケジュールタブ */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* プロジェクト凡例 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">プロジェクト凡例</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {projects.map((project) => {
                  const schedule = schedules[project.id];
                  if (!schedule) return null;
                  
                  return (
                    <div key={project.id} className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${getProjectBorderColor(schedule).replace('border-l-', 'bg-')}`}></div>
                      <span className="text-sm font-medium text-gray-700 truncate">{project.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 全体スケジュール表示 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">全プロジェクト統合スケジュール</h3>

              {viewMode === 'calendar' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const allPhases = getAllPhases();
                    return allPhases.map((phase) => {
                      const schedule = schedules[phase.projectId];
                      const borderColor = getProjectBorderColor(schedule);
                      const textColor = getProjectTextColor(schedule);
                      
                      return (
                        <motion.div
                          key={`${phase.projectId}-${phase.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`${phase.color} rounded-xl p-4 text-white shadow-lg border-l-8 ${borderColor}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">{phase.icon}</span>
                              <h4 className="font-bold text-lg">{phase.title}</h4>
                            </div>
                            <div className="bg-white/20 px-2 py-1 rounded-full">
                              <span className="text-xs font-medium">{phase.projectTitle}</span>
                            </div>
                          </div>
                          <p className="text-sm opacity-90 mb-3">{phase.description}</p>
                          <div className="text-sm">
                            <p className="font-medium">
                              {formatDate(phase.startDate)}
                              {phase.endDate && ` - ${formatDate(phase.endDate)}`}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                              phase.status === 'completed' ? 'bg-green-200 text-green-800' :
                              phase.status === 'in_progress' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {phase.status === 'completed' ? '完了' :
                               phase.status === 'in_progress' ? '進行中' : '待機中'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const allPhases = getAllPhases();
                    return allPhases.map((phase) => {
                      const schedule = schedules[phase.projectId];
                      const borderColor = getProjectBorderColor(schedule);
                      const textColor = getProjectTextColor(schedule);
                      
                      return (
                        <motion.div
                          key={`${phase.projectId}-${phase.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl border-l-4 ${borderColor}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-4 h-4 rounded-full ${
                              phase.status === 'completed' ? 'bg-green-500' :
                              phase.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-2xl">{phase.icon}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-gray-800">{phase.title}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${textColor} bg-gray-100`}>
                                  {phase.projectTitle}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{phase.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">
                              {formatDate(phase.startDate)}
                              {phase.endDate && ` - ${formatDate(phase.endDate)}`}
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              phase.status === 'completed' ? 'bg-green-100 text-green-800' :
                              phase.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {phase.status === 'completed' ? '完了' :
                               phase.status === 'in_progress' ? '進行中' : '待機中'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectSchedulePage;