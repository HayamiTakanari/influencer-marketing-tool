import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getMyProjects, getProjectSchedule, generateInvoiceFromProject } from '../services/api';
import GanttChart from '../components/GanttChart';

type PhaseType = 
  | 'FORMAL_REQUEST'         // 正式依頼
  | 'PRODUCT_RECEIPT'        // 商品受領
  | 'DRAFT_CONTE_CREATION'   // 初稿構成案作成
  | 'DRAFT_CONTE_SUBMIT'     // 初稿構成案提出
  | 'CONTE_FEEDBACK'         // 字構成案戻し
  | 'CONTE_REVISION'         // 構成案修正
  | 'CONTE_FINALIZE'         // 修正稿構成案FIX
  | 'SHOOTING'               // 撮影
  | 'DRAFT_VIDEO_SUBMIT'     // 初稿動画提出
  | 'VIDEO_FEEDBACK'         // 初稿動画戻し
  | 'VIDEO_REVISION'         // 動画修正
  | 'VIDEO_DATA_SUBMIT'      // 動画データ提出
  | 'VIDEO_FINALIZE'         // 動画FIX
  | 'POSTING'                // 投稿
  | 'INSIGHT_SUBMIT';        // インサイトデータ提出

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
  companyId: string;
  matchedInfluencerId?: string;
}

const PHASE_CONFIG: Record<PhaseType, { title: string; description: string; color: string; icon: string; isDateRange: boolean }> = {
  FORMAL_REQUEST: { title: '正式依頼', description: 'プロジェクトの正式依頼日', color: 'bg-blue-500', icon: '📄', isDateRange: false },
  PRODUCT_RECEIPT: { title: '商品受領', description: 'PR商品の受領日', color: 'bg-green-500', icon: '📦', isDateRange: false },
  DRAFT_CONTE_CREATION: { title: '初稿構成案作成', description: '初稿コンテンツの企画・作成期間', color: 'bg-purple-500', icon: '✏️', isDateRange: true },
  DRAFT_CONTE_SUBMIT: { title: '初稿構成案提出', description: '初稿コンテンツの提出日', color: 'bg-indigo-500', icon: '📝', isDateRange: false },
  CONTE_FEEDBACK: { title: '字構成案戻し', description: 'コンテンツに対するフィードバック期間', color: 'bg-yellow-500', icon: '💬', isDateRange: true },
  CONTE_REVISION: { title: '構成案修正', description: 'コンテンツの修正・改善期間', color: 'bg-orange-500', icon: '🔄', isDateRange: true },
  CONTE_FINALIZE: { title: '修正稿構成案FIX', description: '修正稿コンテンツの確定日', color: 'bg-red-500', icon: '✅', isDateRange: false },
  SHOOTING: { title: '撮影', description: 'コンテンツ撮影期間', color: 'bg-pink-500', icon: '🎥', isDateRange: true },
  DRAFT_VIDEO_SUBMIT: { title: '初稿動画提出', description: '編集した初稿動画の提出日', color: 'bg-teal-500', icon: '🎬', isDateRange: false },
  VIDEO_FEEDBACK: { title: '初稿動画戻し', description: '初稿動画に対するフィードバック期間', color: 'bg-cyan-500', icon: '📹', isDateRange: true },
  VIDEO_REVISION: { title: '動画修正', description: '動画の修正・再編集期間', color: 'bg-emerald-500', icon: '🎞️', isDateRange: true },
  VIDEO_DATA_SUBMIT: { title: '動画データ提出', description: '修正済み動画データの提出日', color: 'bg-lime-500', icon: '💾', isDateRange: false },
  VIDEO_FINALIZE: { title: '動画FIX', description: '最終動画の確定日', color: 'bg-amber-500', icon: '🎯', isDateRange: false },
  POSTING: { title: '投稿', description: 'SNS投稿実施日', color: 'bg-rose-500', icon: '📱', isDateRange: false },
  INSIGHT_SUBMIT: { title: 'インサイトデータ提出', description: '投稿結果・インサイトデータの提出日', color: 'bg-violet-500', icon: '📊', isDateRange: false }
};

const ProjectSchedulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'project' | 'overview' | 'gantt'>('project');
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

    if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(''); // エラーメッセージをリセット
      
      console.log('プロジェクトデータを取得中...');
      const projectsData = await getMyProjects();
      console.log('取得されたプロジェクトデータ:', projectsData);
      
      // プロジェクトデータが存在する場合はそれを使用
      const projectList = projectsData?.projects || [];
      
      if (projectList.length > 0) {
        console.log(`${projectList.length}件のプロジェクトを取得しました`);
        setProjects(projectList);
        setSelectedProject(projectList[0].id);
        await fetchSchedules(projectList);
      } else {
        console.log('プロジェクトが見つかりませんでした');
        setError('プロジェクトが見つかりませんでした。');
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      console.error('エラーの詳細:', err.response?.data || err.message);
      
      // エラーが発生した場合は明確にエラー状態を設定
      setError('プロジェクトデータの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (projectList: Project[]) => {
    const scheduleData: { [key: string]: ProjectSchedule } = {};
    
    for (const project of projectList) {
      try {
        console.log(`プロジェクト ${project.title} のスケジュールを取得中...`);
        const schedule = await getProjectSchedule(project.id);
        if (schedule && schedule.phases && schedule.phases.length > 0) {
          scheduleData[project.id] = schedule;
        }
        console.log(`プロジェクト ${project.title} のスケジュールを取得しました`);
      } catch (error) {
        console.error(`Error fetching schedule for project ${project.id}:`, error);
        // APIエラーの場合は空のスケジュールを設定
        scheduleData[project.id] = { phases: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }
    }
    
    console.log('すべてのスケジュールデータを設定:', scheduleData);
    setSchedules(scheduleData);
  };

  // 請求書生成機能
  const handleGenerateInvoice = async (projectId: string) => {
    try {
      setLoading(true);
      const invoice = await generateInvoiceFromProject(projectId);
      alert('請求書が自動生成されました！');
      router.push(`/invoices/${invoice.id}`);
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      alert('請求書の生成に失敗しました。手動で作成してください。');
      router.push('/invoices/create');
    } finally {
      setLoading(false);
    }
  };

  // プロジェクトが完了状態かどうかをチェック
  const isProjectCompleted = (projectId: string): boolean => {
    const schedule = schedules[projectId];
    if (!schedule) return false;
    
    // 最終フェーズ（INSIGHT_SUBMIT）が完了しているかチェック
    const finalPhase = schedule.phases.find(phase => phase.type === 'INSIGHT_SUBMIT');
    return finalPhase?.status === 'completed';
  };

  // プロジェクト完了率を計算
  const getProjectProgress = (projectId: string): number => {
    const schedule = schedules[projectId];
    if (!schedule) return 0;
    
    const completedPhases = schedule.phases.filter(phase => phase.status === 'completed');
    return Math.round((completedPhases.length / schedule.phases.length) * 100);
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

  const convertPhaseToGanttTask = (phase: Phase, projectTitle: string, projectId: string) => {
    const startDate = new Date(phase.startDate);
    const endDate = phase.endDate ? new Date(phase.endDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // デフォルト1日
    
    let progress = 0;
    if (phase.status === 'completed') progress = 100;
    else if (phase.status === 'in_progress') progress = 50;
    
    return {
      id: phase.id,
      name: phase.title,
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      progress,
      custom_class: phase.status,
      projectTitle: projectTitle // プロジェクト名は別プロパティとして保持
    };
  };

  const getGanttTasks = () => {
    const tasks: any[] = [];
    
    if (selectedProject && schedules[selectedProject]) {
      // プロジェクト別ガントチャート（プロジェクト名は表示しない）
      const project = projects.find(p => p.id === selectedProject);
      const schedule = schedules[selectedProject];
      
      if (project && schedule) {
        schedule.phases.forEach((phase) => {
          const task = convertPhaseToGanttTask(phase, project.title, project.id);
          // プロジェクト別表示ではprojectTitleを設定しない
          const { projectTitle, ...taskWithoutProject } = task;
          tasks.push(taskWithoutProject);
        });
      }
    } else {
      // 全体ガントチャート（プロジェクト名を表示）
      projects.forEach(project => {
        const schedule = schedules[project.id];
        if (schedule && schedule.phases) {
          schedule.phases.forEach((phase) => {
            tasks.push(convertPhaseToGanttTask(phase, project.title, project.id));
          });
        }
      });
    }
    
    return tasks.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
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

  if (error && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">データの取得に失敗しました</h3>
            <p className="text-gray-600 mb-4">
              プロジェクトデータを取得できませんでした。<br/>
              ネットワーク接続を確認するか、しばらく後に再試行してください。
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={fetchData}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {loading ? '取得中...' : '再試行'}
            </button>
            
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
            >
              ダッシュボードに戻る
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            問題が継続する場合は、ブラウザのコンソールでエラーの詳細をご確認ください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">ダッシュボードに戻る</span>
            </button>
            <h1 
              className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-500"
            >
              プロジェクトスケジュール
            </h1>
          </div>
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
            <button
              onClick={() => setActiveTab('gantt')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'gantt'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              📊 ガントチャート
            </button>
          </div>

          {activeTab !== 'gantt' && (
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
          )}
        </div>

        {/* プロジェクト別タブ */}
        {activeTab === 'project' && (
          <div
            className="space-y-6 transition-all duration-500"
          >
            {/* プロジェクト選択 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {projects.map((project) => {
                const progress = getProjectProgress(project.id);
                const completed = isProjectCompleted(project.id);
                
                return (
                  <div
                    key={project.id}
                    className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:scale-105 transition-all ${
                      selectedProject === project.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div onClick={() => setSelectedProject(project.id)} className="cursor-pointer">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                      
                      {/* 進捗バー */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600">進捗</span>
                          <span className="text-xs font-bold text-gray-800">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          completed 
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'IN_PROGRESS' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {completed ? '完了' : project.status}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* 請求書生成ボタン（完了時のみ表示） */}
                    {completed && user?.role === 'INFLUENCER' && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateInvoice(project.id);
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>請求書を生成</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
                      <div
                        key={phase.id}
                        className={`${phase.color} rounded-xl p-4 text-white shadow-lg transition-all duration-300`}
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules[selectedProject].phases.map((phase) => (
                      <div
                        key={phase.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl transition-all duration-300"
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 全体スケジュールタブ */}
        {activeTab === 'overview' && (
          <div
            className="space-y-6 transition-all duration-500"
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
                        <div
                          key={`${phase.projectId}-${phase.id}`}
                          className={`${phase.color} rounded-xl p-4 text-white shadow-lg border-l-8 ${borderColor} transition-all duration-300`}
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
                        </div>
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
                        <div
                          key={`${phase.projectId}-${phase.id}`}
                          className={`flex items-center justify-between p-4 bg-gray-50 rounded-xl border-l-4 ${borderColor} transition-all duration-300`}
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
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ガントチャートタブ */}
        {activeTab === 'gantt' && (
          <div
            className="space-y-6 transition-all duration-500"
          >
            {/* プロジェクト選択（ガントチャート用） */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">ガントチャート表示</h3>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedProject(null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      !selectedProject
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    全プロジェクト
                  </button>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all truncate max-w-xs ${
                        selectedProject === project.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {project.title}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* ガントチャートコンポーネント */}
              {getGanttTasks().length > 0 ? (
                <GanttChart
                  tasks={getGanttTasks()}
                  viewMode="Day"
                  onTaskClick={(task) => {
                    console.log('Task clicked:', task);
                  }}
                  readOnly={false}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-600 mb-2">
                    スケジュールデータがありません
                  </h4>
                  <p className="text-gray-500">
                    プロジェクトスケジュールが設定されていない場合、ガントチャートを表示できません。
                  </p>
                </div>
              )}
            </div>

            {/* ガントチャートの説明・凡例 */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">ガントチャートの見方</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">完了済み (100%)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span className="text-sm font-medium text-gray-700">進行中 (50%)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-gray-500"></div>
                  <span className="text-sm font-medium text-gray-700">未開始 (0%)</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>• バーをクリックするとタスクの詳細が表示されます</p>
                <p>• 上部のボタンで表示期間（日・週・月）を切り替えできます</p>
                <p>• プロジェクトボタンで特定のプロジェクトのみ表示することもできます</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSchedulePage;