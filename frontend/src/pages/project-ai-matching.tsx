import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAIRecommendedInfluencersForProject } from '../services/api';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  targetPlatforms: string[];
  brandName?: string;
  productName?: string;
  campaignObjective?: string;
  campaignTarget?: string;
  messageToConvey?: string;
}

interface AIRecommendedInfluencer {
  id: string;
  displayName: string;
  bio: string;
  categories: string[];
  prefecture: string;
  socialAccounts: {
    id: string;
    platform: string;
    followerCount: number;
    engagementRate: number;
    isVerified: boolean;
  }[];
  aiScore: number;
  matchReasons: string[];
  isRecommended: boolean;
}

const ProjectAIMatchingPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [recommendedInfluencers, setRecommendedInfluencers] = useState<AIRecommendedInfluencer[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { projectId } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // 企業ユーザーのみアクセス可能
    if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
      router.push('/dashboard');
      return;
    }

    if (projectId) {
      fetchProjectAndGetRecommendations();
    }
  }, [router, projectId]);

  const fetchProjectAndGetRecommendations = async () => {
    try {
      setLoading(true);
      setAiLoading(true);
      setError('');

      // プロジェクト情報を取得（localStorage から一時的に取得、本来はAPIから）
      const projectData = localStorage.getItem('recentProject');
      if (projectData) {
        const parsedProject = JSON.parse(projectData);
        setProject(parsedProject);
        
        // AIレコメンデーションを取得
        await getAIRecommendations(parsedProject);
      } else {
        setError('プロジェクト情報が見つかりません。');
      }
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError('プロジェクト情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const getAIRecommendations = async (projectData: Project) => {
    try {
      setAiLoading(true);
      
      const aiData = await getAIRecommendedInfluencersForProject({
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        budget: projectData.budget,
        targetPlatforms: projectData.targetPlatforms,
        brandName: projectData.brandName,
        productName: projectData.productName,
        campaignObjective: projectData.campaignObjective,
        campaignTarget: projectData.campaignTarget,
        messageToConvey: projectData.messageToConvey
      });

      setRecommendedInfluencers(aiData.influencers || []);
      setAiAnalysis(aiData.analysis || null);
      
    } catch (err: any) {
      console.error('Error getting AI recommendations:', err);
      setError('AIレコメンデーションの取得に失敗しました。');
    } finally {
      setAiLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return '📸';
      case 'youtube': return '🎥';
      case 'tiktok': return '🎵';
      case 'twitter': return '🐦';
      default: return '📱';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">プロジェクト情報を読み込み中...</p>
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
            <Link href="/projects" className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 hover:text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">プロジェクト管理に戻る</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI インフルエンサーマッチング</h1>
              <p className="text-sm text-gray-600">あなたのプロジェクトに最適なインフルエンサーをAIが選出</p>
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

        {/* プロジェクト情報 */}
        {project && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {project.category}
                </span>
                <span className="text-lg font-bold text-green-600">
                  ¥{project.budget.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">{project.description}</p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">対象プラットフォーム:</span>
              <div className="flex space-x-2">
                {project.targetPlatforms.map(platform => (
                  <span key={platform} className="text-lg">
                    {getPlatformIcon(platform)}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* AI分析結果 */}
        {aiAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-3xl p-8 shadow-xl mb-8"
          >
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-2xl font-bold text-purple-900">AI分析結果</h3>
            </div>
            <p className="text-purple-800 mb-4 text-lg">{aiAnalysis.recommendationSummary}</p>
            {aiAnalysis.detectedKeywords && aiAnalysis.detectedKeywords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-purple-700 mb-2">検出されたキーワード:</p>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.detectedKeywords.map((keyword: any, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {keyword.category} ({keyword.score})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* AIレコメンド結果 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              おすすめインフルエンサー ({recommendedInfluencers.length}人)
            </h3>
            {aiLoading && (
              <div className="flex items-center space-x-2 text-purple-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span className="text-sm">AI分析中...</span>
              </div>
            )}
          </div>

          {!aiLoading && recommendedInfluencers.length > 0 && (
            <div className="hidden lg:flex items-center px-3 pb-2 text-xs text-gray-500 font-medium border-b border-gray-200 mb-2">
              <div className="w-14 text-center mr-2">スコア</div>
              <div className="w-40 mr-3">アカウント名</div>
              <div className="flex-1 mr-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="space-y-1">
                    <div>Instagram</div>
                    <div className="text-[10px] text-gray-400">ﾌｫﾛﾜｰ/Eng%/再生</div>
                  </div>
                  <div className="space-y-1">
                    <div>YouTube</div>
                    <div className="text-[10px] text-gray-400">登録者/Eng%/再生</div>
                  </div>
                  <div className="space-y-1">
                    <div>TikTok</div>
                    <div className="text-[10px] text-gray-400">ﾌｫﾛﾜｰ/Eng%/再生</div>
                  </div>
                  <div className="space-y-1">
                    <div>Twitter</div>
                    <div className="text-[10px] text-gray-400">ﾌｫﾛﾜｰ/Eng%/再生</div>
                  </div>
                </div>
              </div>
              <div className="flex-[2] mr-3">紹介文</div>
              <div className="w-32">アクション</div>
            </div>
          )}

          {aiLoading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg h-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recommendedInfluencers.map((influencer, index) => {
                // 平均エンゲージメント率を計算
                const avgEngagement = influencer.socialAccounts.length > 0 
                  ? (influencer.socialAccounts.reduce((sum, acc) => sum + acc.engagementRate, 0) / influencer.socialAccounts.length).toFixed(1)
                  : '0.0';
                
                // 推定平均再生数（YouTubeの場合は再生数、その他はフォロワー数×エンゲージメント率）
                const avgViews = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube')
                  ? Math.round(influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube')!.followerCount * 0.1) // YouTubeは登録者数の10%を仮定
                  : Math.round(influencer.socialAccounts[0]?.followerCount * (influencer.socialAccounts[0]?.engagementRate / 100) || 0);

                return (
                  <motion.div
                    key={influencer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`bg-white border rounded-lg hover:shadow-md transition-all ${
                      influencer.isRecommended ? 'border-green-400' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center p-2">
                      {/* AIスコアとおすすめマーク */}
                      <div className="w-14 text-center mr-2">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xs font-bold ${
                          influencer.aiScore >= 90 ? 'bg-green-100 text-green-800' :
                          influencer.aiScore >= 80 ? 'bg-blue-100 text-blue-800' :
                          influencer.aiScore >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {influencer.aiScore}%
                        </div>
                        {influencer.isRecommended && (
                          <div className="text-xs text-green-600 font-semibold mt-1">推奨</div>
                        )}
                      </div>

                      {/* アカウント名とプロフィール画像 */}
                      <div className="flex items-center w-40 mr-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0">
                          {influencer.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 truncate">{influencer.displayName}</h4>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            {influencer.socialAccounts.map((account, idx) => (
                              <span key={idx} title={account.platform}>
                                {getPlatformIcon(account.platform)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* プラットフォーム別データ */}
                      <div className="flex-1 mr-3">
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {/* Instagram */}
                          <div className="text-center">
                            {(() => {
                              const instagram = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'instagram');
                              if (instagram) {
                                return (
                                  <>
                                    <div className="font-semibold text-gray-900">{formatNumber(instagram.followerCount)}</div>
                                    <div className="text-gray-600">{instagram.engagementRate.toFixed(1)}%</div>
                                    <div className="text-gray-500">{formatNumber(Math.round(instagram.followerCount * instagram.engagementRate / 100))}</div>
                                  </>
                                );
                              }
                              return <div className="text-gray-400">-</div>;
                            })()}
                          </div>
                          
                          {/* YouTube */}
                          <div className="text-center">
                            {(() => {
                              const youtube = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'youtube');
                              if (youtube) {
                                return (
                                  <>
                                    <div className="font-semibold text-gray-900">{formatNumber(youtube.followerCount)}</div>
                                    <div className="text-gray-600">{youtube.engagementRate.toFixed(1)}%</div>
                                    <div className="text-gray-500">{formatNumber(Math.round(youtube.followerCount * 0.1))}</div>
                                  </>
                                );
                              }
                              return <div className="text-gray-400">-</div>;
                            })()}
                          </div>
                          
                          {/* TikTok */}
                          <div className="text-center">
                            {(() => {
                              const tiktok = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'tiktok');
                              if (tiktok) {
                                return (
                                  <>
                                    <div className="font-semibold text-gray-900">{formatNumber(tiktok.followerCount)}</div>
                                    <div className="text-gray-600">{tiktok.engagementRate.toFixed(1)}%</div>
                                    <div className="text-gray-500">{formatNumber(Math.round(tiktok.followerCount * tiktok.engagementRate / 100))}</div>
                                  </>
                                );
                              }
                              return <div className="text-gray-400">-</div>;
                            })()}
                          </div>
                          
                          {/* Twitter */}
                          <div className="text-center">
                            {(() => {
                              const twitter = influencer.socialAccounts.find(acc => acc.platform.toLowerCase() === 'twitter');
                              if (twitter) {
                                return (
                                  <>
                                    <div className="font-semibold text-gray-900">{formatNumber(twitter.followerCount)}</div>
                                    <div className="text-gray-600">{twitter.engagementRate.toFixed(1)}%</div>
                                    <div className="text-gray-500">{formatNumber(Math.round(twitter.followerCount * twitter.engagementRate / 100))}</div>
                                  </>
                                );
                              }
                              return <div className="text-gray-400">-</div>;
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* 紹介文 */}
                      <div className="flex-[2] mr-3">
                        <p className="text-xs text-gray-700 line-clamp-2">{influencer.bio}</p>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex space-x-2 w-32">
                        <button
                          onClick={() => router.push(`/influencer/${influencer.id}`)}
                          className="px-2.5 py-1.5 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors whitespace-nowrap"
                        >
                          詳細
                        </button>
                        <button
                          onClick={() => {
                            // TODO: 問い合わせ機能の実装
                            alert('問い合わせ機能は準備中です');
                          }}
                          className="px-2.5 py-1.5 bg-green-500 text-white rounded text-xs font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                        >
                          問い合わせ
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!aiLoading && recommendedInfluencers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">マッチするインフルエンサーが見つかりませんでした</h3>
              <p className="text-gray-600">プロジェクトの条件を調整して再度お試しください。</p>
            </div>
          )}
        </motion.div>

        {/* アクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex justify-center space-x-4 mt-8"
        >
          <button
            onClick={() => router.push(`/project-detail?id=${projectId}`)}
            className="px-8 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
          >
            プロジェクト詳細を見る
          </button>
          <button
            onClick={() => getAIRecommendations(project!)}
            disabled={!project || aiLoading}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading ? 'AI分析中...' : '再分析'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectAIMatchingPage;