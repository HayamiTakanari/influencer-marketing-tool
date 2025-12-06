import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  targetPlatforms: string[];
  targetPrefecture: string;
  targetCity: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  targetFollowerMin: number;
  targetFollowerMax: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  applications: any[];
}

const ProjectDetailPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }
      
      if (id) {
        fetchProjectDetails();
      }
    } else {
      router.push('/login');
    }
  }, [id, router]);

  const fetchProjectDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/projects/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const data = await response.json();
      setProject(data.project);
      setError('');
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError('プロジェクトの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (parsedUser.role !== "COMPANY" && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
        return;
      }

      if (id) {
        fetchProjectDetails();
      }
    } else {
      router.push('/login');
    }
  }, [id, router]);

  if (loading) {
    return (
      <DashboardLayout title="プロジェクト詳細" subtitle="読み込み中...">
        <LoadingState />
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout title="エラー" subtitle="プロジェクトの読み込みに失敗しました">
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error || 'プロジェクトが見つかりませんでした。'}</p>
          <Link href="/projects">
            <Button variant="primary" size="lg">
              プロジェクト一覧に戻る
            </Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: '募集中', color: 'bg-yellow-100 text-yellow-800' };
      case 'MATCHED': return { label: 'マッチング済み', color: 'bg-blue-100 text-blue-800' };
      case 'IN_PROGRESS': return { label: '進行中', color: 'bg-green-100 text-green-800' };
      case 'COMPLETED': return { label: '完了', color: 'bg-purple-100 text-purple-800' };
      case 'CANCELLED': return { label: 'キャンセル', color: 'bg-red-100 text-red-800' };
      default: return { label: '不明', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* ランディングページと同じ背景デザイン */}
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
            <pattern id="artistic-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="1" fill="#000000" opacity="0.6" />
              <circle cx="30" cy="30" r="0.5" fill="#000000" opacity="0.4" />
              <circle cx="90" cy="90" r="0.5" fill="#000000" opacity="0.4" />
              <line x1="20" y1="20" x2="40" y2="40" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
              <line x1="80" y1="80" x2="100" y2="100" stroke="#000000" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#artistic-pattern)" />
        </svg>
        
        {/* シンプルな波パターン */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.03) 31%, rgba(0,0,0,0.03) 32%, transparent 33%)
          `,
          backgroundSize: '200px 200px'
        }} />
        
        {/* アシンメトリックライン */}
        <svg className="absolute top-1/4 left-0 w-full h-px opacity-[0.05]" preserveAspectRatio="none">
          <path d="M0,0 Q400,0 800,0 T1600,0" stroke="#000000" strokeWidth="1" fill="none" />
        </svg>
        <svg className="absolute top-3/4 left-0 w-full h-px opacity-[0.05]" preserveAspectRatio="none">
          <path d="M0,0 Q600,0 1200,0 T2400,0" stroke="#000000" strokeWidth="1" fill="none" />
        </svg>
      </div>

      {/* ナビゲーション */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 z-50" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div


              className="text-2xl font-bold text-gray-900 relative"
            >
              <span className="relative z-10">
                InfluenceLink
              </span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">{user?.email}</span>
              <motion.button
                onClick={handleLogout}


                className="relative text-white px-4 py-2 font-medium overflow-hidden group"
                style={{ 
                  clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 100%, 8px 100%)',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)'
                }}
              >
                <span className="relative z-10">ログアウト</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <div className="pt-20 pb-12 px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* ページタイトル */}
          <div



            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              プロジェクト詳細
            </h1>
            <div className="flex items-center justify-center gap-4 mb-6">
              <Link href="/projects">
                <motion.button


                  className="relative text-gray-700 px-6 py-2 font-medium border border-gray-300 overflow-hidden group"
                  style={{
                    background: 'white',
                    boxShadow: '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06)'
                  }}
                >
                  <span className="relative z-10">← プロジェクト一覧に戻る</span>
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)' }}



                  />
                </motion.button>
              </Link>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusInfo(project.status).color}`}>
                {getStatusInfo(project.status).label}
              </span>
            </div>
          </div>

          {/* プロジェクト詳細カード */}
          <div



            className="relative bg-white p-8 mb-8 group transition-all border border-gray-200"
            style={{ 
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
            {/* シンプルアーティスティックパターン */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(0,0,0,0.05) 1px, transparent 1px),
                radial-gradient(circle at 80% 80%, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px, 80px 80px'
            }} />
            
            {/* サブトルな内側シャドウ */}
            <div className="absolute inset-0 pointer-events-none" style={{
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.03), inset -1px -1px 2px rgba(255,255,255,0.5)'
            }} />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 md:mb-0">
                {project.title}
              </h2>
              <div className="text-3xl font-bold text-emerald-600">
                {formatPrice(project.budget)}
              </div>
            </div>
            
            <p className="text-gray-700 mb-8 text-lg relative z-10">{project.description}</p>

            {/* 統計情報グリッド */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
              {[
                { label: 'カテゴリー', value: project.category },
                { label: 'プロジェクト開始日', value: formatDate(project.startDate) },
                { label: 'プロジェクト終了日', value: formatDate(project.endDate) },
                { label: '応募数', value: `${project.applications.length}件` }
              ].map((item, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 border border-gray-200"
                  style={{
                    boxShadow: '2px 2px 0 rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
                  }}
                >
                  <div className="text-lg font-bold text-gray-900 mb-1">{item.value}</div>
                  <div className="text-gray-600 text-sm">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="border-t pt-8 relative z-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 relative">
                ターゲット情報
                <div className="absolute -bottom-1 left-0 w-8 h-0.5 opacity-80" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'プラットフォーム', value: project.targetPlatforms.join(', ') },
                  { label: '地域', value: `${project.targetPrefecture} ${project.targetCity}` },
                  { label: '性別', value: project.targetGender === 'FEMALE' ? '女性' : project.targetGender === 'MALE' ? '男性' : '指定なし' },
                  { label: '年齢', value: `${project.targetAgeMin}歳 - ${project.targetAgeMax}歳` },
                  { label: 'フォロワー数', value: `${project.targetFollowerMin.toLocaleString()} - ${project.targetFollowerMax.toLocaleString()}` }
                ].map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 border border-gray-200"
                    style={{
                      boxShadow: '2px 2px 0 rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
                    }}
                  >
                    <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                    <p className="font-medium text-gray-900 text-lg">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ホバー時のアクセント */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ background: 'linear-gradient(90deg, #34d399, #14b8a6, #10b981, #059669)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: { params: { id: string } }) {
  const { id } = context.params;
  
  return {
    props: {
      projectId: id,
    },
  };
}

export default ProjectDetailPage;