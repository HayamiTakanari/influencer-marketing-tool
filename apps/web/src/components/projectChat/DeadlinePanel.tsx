import React from 'react';
import { Project, User } from '../../types/projectChat';

interface DeadlinePanelProps {
  project: Project;
  user: User;
  showDatePicker: string | null;
  setShowDatePicker: (milestoneId: string | null) => void;
  proposedDate: string;
  setProposedDate: (date: string) => void;
  onProposeDueDate: (milestoneId: string, proposedDate: string) => void;
  onAgreeDueDate: (milestoneId: string) => void;
  onRejectDueDate: (milestoneId: string) => void;
  formatDateTime: (dateString: string) => string;
  getDaysUntilDeadline: (dateString: string) => number;
}

const DeadlinePanel: React.FC<DeadlinePanelProps> = ({
  project,
  user,
  showDatePicker,
  setShowDatePicker,
  proposedDate,
  setProposedDate,
  onProposeDueDate,
  onAgreeDueDate,
  onRejectDueDate,
  formatDateTime,
  getDaysUntilDeadline
}) => {
  if (!project?.progress) return null;

  return (
    <div className="mt-6 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl transition-all duration-800 ease-in-out">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <span className="mr-2">📅</span>
          期日管理
        </h3>
        <div className="text-sm text-gray-600">
          双方の合意で期日を設定
        </div>
      </div>
      
      {/* 期日設定が必要なマイルストーン */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {project.progress.milestones
          .filter(milestone => milestone.status !== 'completed')
          .slice(0, 9) // 最初の9件のみ表示
          .map((milestone) => (
          <div key={milestone.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-sm">{milestone.title}</h4>
              <div className={`w-3 h-3 rounded-full ${
                milestone.status === 'in_progress' ? 'bg-blue-500' :
                milestone.status === 'completed' ? 'bg-green-500' :
                'bg-gray-300'
              }`}></div>
            </div>
            
            {/* 合意済み期日 */}
            {milestone.dueDateStatus === 'agreed' && milestone.dueDate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-medium text-sm">✅ 合意済み</span>
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  期日: {formatDateTime(milestone.dueDate)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getDaysUntilDeadline(milestone.dueDate) < 0 ? 
                    `${Math.abs(getDaysUntilDeadline(milestone.dueDate))}日過ぎています` :
                    getDaysUntilDeadline(milestone.dueDate) === 0 ?
                    '今日が期日です' :
                    `あと${getDaysUntilDeadline(milestone.dueDate)}日`
                  }
                </div>
              </div>
            )}
            
            {/* 提案中の期日 */}
            {(milestone.dueDateStatus === 'proposed_by_client' || milestone.dueDateStatus === 'proposed_by_influencer') && milestone.proposedDueDate && (
              <div className={`border rounded-lg p-3 ${
                milestone.dueDateStatus === 'proposed_by_client' ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-sm ${
                    milestone.dueDateStatus === 'proposed_by_client' ? 'text-orange-700' : 'text-purple-700'
                  }`}>
                    {milestone.dueDateStatus === 'proposed_by_client' ? '🏢 企業からの提案' : '📺 インフルエンサーからの提案'}
                  </span>
                </div>
                <div className="text-sm text-gray-700 mb-3">
                  提案期日: {formatDateTime(milestone.proposedDueDate)}
                </div>
                
                {/* 提案された側ではないユーザーに合意/拒否ボタンを表示 */}
                {((milestone.dueDateStatus === 'proposed_by_client' && user?.role === 'INFLUENCER') ||
                  (milestone.dueDateStatus === 'proposed_by_influencer' && user?.role === "COMPANY")) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAgreeDueDate(milestone.id)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg font-medium hover:bg-green-600 transition-colors"
                    >
                      ✅ 合意
                    </button>
                    <button
                      onClick={() => onRejectDueDate(milestone.id)}
                      className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                      ❌ 拒否
                    </button>
                  </div>
                )}
                
                {/* 提案した側のユーザーには待機メッセージ */}
                {((milestone.dueDateStatus === 'proposed_by_client' && user?.role === "COMPANY") ||
                  (milestone.dueDateStatus === 'proposed_by_influencer' && user?.role === 'INFLUENCER')) && (
                  <div className="text-sm text-gray-600 text-center bg-gray-50 rounded p-2">
                    相手の回答を待っています...
                  </div>
                )}
              </div>
            )}
            
            {/* 期日未設定 */}
            {milestone.dueDateStatus === 'not_set' && (
              <div className="space-y-3">
                {showDatePicker === milestone.id ? (
                  <div className="space-y-3">
                    <input
                      type="datetime-local"
                      value={proposedDate}
                      onChange={(e) => setProposedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onProposeDueDate(milestone.id, proposedDate)}
                        disabled={!proposedDate}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        提案する
                      </button>
                      <button
                        onClick={() => {
                          setShowDatePicker(null);
                          setProposedDate('');
                        }}
                        className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDatePicker(milestone.id)}
                    className="w-full px-3 py-2 bg-blue-50 border-2 border-dashed border-blue-300 text-blue-600 text-sm rounded-lg font-medium hover:bg-blue-100 transition-colors"
                  >
                    + 期日を提案する
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 期日管理の説明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800 mb-1">期日設定の流れ</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>・ 企業またはインフルエンサーのどちらかが期日を提案</p>
              <p>・ 相手が合意または拒否で回答</p>
              <p>・ 合意された期日が正式に設定されます</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeadlinePanel;