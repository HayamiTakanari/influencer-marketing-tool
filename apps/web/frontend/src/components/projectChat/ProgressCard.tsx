import React from 'react';
import { Project, User } from '../../types/projectChat';

interface ProgressCardProps {
  project: Project;
  user: User;
  formatDate: (dateString: string) => string;
  getDaysUntilDeadline: (dateString: string) => number;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  project,
  user,
  formatDate,
  getDaysUntilDeadline,
  getPriorityColor,
  getStatusColor
}) => {
  if (!project.progress) return null;

  const renderMilestoneGrid = (milestones: any[], startIndex: number, endIndex: number) => (
    <div className="grid grid-cols-5 gap-2 mb-4">
      {milestones.slice(startIndex, endIndex).map((milestone, index) => (
        <div key={milestone.id} className="text-center relative group">
          <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
            milestone.status === 'completed' ? 'bg-green-500 text-white' :
            milestone.status === 'in_progress' ? 'bg-blue-500 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {milestone.status === 'completed' ? '✓' : startIndex + index + 1}
          </div>
          <div className={`text-xs ${
            milestone.status === 'completed' ? 'text-green-700 font-medium' :
            milestone.status === 'in_progress' ? 'text-blue-700 font-medium' :
            'text-gray-600'
          }`}>
            {milestone.title}
          </div>
          
          {/* 期日情報 */}
          {milestone.dueDate && (
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(milestone.dueDate)}
            </div>
          )}
          
          {/* 期日提案アイコン */}
          {milestone.dueDateStatus === 'proposed_by_client' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full" title="企業から期日提案中">
              <span className="text-xs text-white">🏢</span>
            </div>
          )}
          {milestone.dueDateStatus === 'proposed_by_influencer' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full" title="インフルエンサーから期日提案中">
              <span className="text-xs text-white">📺</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* プロジェクト進捗 */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl transition-all duration-800 ease-in-out">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <span className="mr-2">📊</span>
            プロジェクト進捗
          </h3>
          <div className="text-sm text-gray-600">
            {project.progress.overallProgress}% 完了
          </div>
        </div>
        
        {/* 進捗バー */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              現在のフェーズ: {project.progress.currentPhase}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress.overallProgress}%` }}
            />
          </div>
        </div>

        {/* マイルストーン */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">ワークフロー進捗</h4>
          
          {/* 簡易フロー表示 */}
          {renderMilestoneGrid(project.progress.milestones, 0, 5)}
          {project.progress.milestones.length > 5 && renderMilestoneGrid(project.progress.milestones, 5, 10)}
          {project.progress.milestones.length > 10 && renderMilestoneGrid(project.progress.milestones, 10, project.progress.milestones.length)}

          {/* 現在進行中のステップをハイライト表示 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm font-medium text-blue-800">
                現在進行中: {project.progress.milestones.find(m => m.status === 'in_progress')?.title}
              </div>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {project.progress.milestones.findIndex(m => m.status === 'in_progress') + 1} / {project.progress.milestones.length} ステップ
            </div>
          </div>
        </div>
      </div>

      {/* ネクストアクション */}
      <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-xl transition-all duration-800 ease-in-out">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <span className="mr-2">🎯</span>
            ネクストアクション
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(project.progress.nextAction.priority)}`}>
            {project.progress.nextAction.priority === 'high' ? '高優先度' :
             project.progress.nextAction.priority === 'medium' ? '中優先度' : '低優先度'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-gray-900 mb-2">
              {project.progress.nextAction.title}
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              {project.progress.nextAction.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">期日</div>
              <div className={`text-sm font-medium ${
                getDaysUntilDeadline(project.progress.nextAction.dueDate) < 0 ? 'text-red-600' :
                getDaysUntilDeadline(project.progress.nextAction.dueDate) <= 2 ? 'text-orange-600' :
                'text-gray-900'
              }`}>
                {formatDate(project.progress.nextAction.dueDate)}
                <div className="text-xs text-gray-500">
                  {getDaysUntilDeadline(project.progress.nextAction.dueDate) < 0 ? 
                    `${Math.abs(getDaysUntilDeadline(project.progress.nextAction.dueDate))}日遅延` :
                    getDaysUntilDeadline(project.progress.nextAction.dueDate) === 0 ?
                    '今日が期日' :
                    `あと${getDaysUntilDeadline(project.progress.nextAction.dueDate)}日`
                  }
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">担当者</div>
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  project.progress.nextAction.assignee === "company" ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  {project.progress.nextAction.assignee === "company" ? 
                    project.client.displayName.charAt(0) : 
                    project.matchedInfluencer.displayName.charAt(0)
                  }
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {project.progress.nextAction.assignee === "company" ? 
                    project.client.displayName : 
                    project.matchedInfluencer.displayName
                  }
                </span>
                {project.progress.nextAction.assignee === user?.role?.toLowerCase() && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                    あなた
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(project.progress.nextAction.status)}`}>
              {project.progress.nextAction.status === 'pending' ? '未着手' :
               project.progress.nextAction.status === 'in_progress' ? '進行中' :
               project.progress.nextAction.status === 'completed' ? '完了' :
               project.progress.nextAction.status === 'overdue' ? '期限超過' : project.progress.nextAction.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;