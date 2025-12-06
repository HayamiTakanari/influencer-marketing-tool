import React from 'react';
import { Project, User } from '../../types/projectChat';

interface ProjectInfoCardProps {
  project: Project;
  user: User;
  isContractEstablished: (project: Project, currentUser: User) => boolean;
  getSubmissions: () => any[];
  onShowSubmissionPanel: () => void;
  onShowConteForm: (type: 'initial' | 'revised') => void;
  onShowVideoForm: (type: 'initial' | 'revised') => void;
  onRequestConteRevision: () => void;
}

const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  project,
  user,
  isContractEstablished,
  getSubmissions,
  onShowSubmissionPanel,
  onShowConteForm,
  onShowVideoForm,
  onRequestConteRevision
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mb-6 transition-all duration-800 ease-in-out">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {/* 企業情報の表示制御 */}
              {isContractEstablished(project, user) ? (
                <span>企業: {project.client.companyName}</span>
              ) : user?.role === 'INFLUENCER' ? (
                <span>企業: 成約後に表示</span>
              ) : (
                <span>企業: {project.client.companyName}</span>
              )}
              <span>•</span>
              <span>インフルエンサー: {project.matchedInfluencer?.displayName || '未決定'}</span>
            </div>
          </div>
        </div>
        
        {/* 提出物一覧ボタン */}
        <div className="flex justify-end mb-3">
          <button
            onClick={onShowSubmissionPanel}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors text-sm flex items-center space-x-2"
          >
            <span>📁</span>
            <span>提出物一覧</span>
            <span className="bg-indigo-700 text-white text-xs px-2 py-0.5 rounded-full">
              {getSubmissions().length}
            </span>
          </button>
        </div>

        {/* アクションボタン */}
        <div className="border-t border-gray-100 pt-4">
          {user?.role === 'INFLUENCER' && (
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 min-w-[100px]">基本提出:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onShowConteForm('initial')}
                    className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg font-medium hover:bg-purple-600 transition-colors"
                  >
                    📋 構成案提出
                  </button>
                  <button
                    onClick={() => onShowVideoForm('initial')}
                    className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    🎥 初稿動画
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 min-w-[100px]">修正版提出:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onShowConteForm('revised')}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg font-medium hover:bg-purple-200 transition-colors"
                  >
                    📋 修正稿構成案
                  </button>
                  <button
                    onClick={() => onShowVideoForm('revised')}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-lg font-medium hover:bg-orange-200 transition-colors"
                  >
                    🎥 修正稿動画
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 企業向け修正依頼ボタン */}
          {user?.role === "COMPANY" && (
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 min-w-[100px]">修正依頼:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onRequestConteRevision}
                  className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  📝 構成案修正依頼
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoCard;