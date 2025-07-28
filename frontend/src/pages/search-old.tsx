import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PageLayout from '../components/shared/PageLayout';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';

const SearchPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [influencers, setInfluencers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      if (parsedUser.role !== 'CLIENT' && parsedUser.role !== 'COMPANY') {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  if (!user) return null;

  return (
    <PageLayout
      title="インフルエンサー検索"
      subtitle="条件を指定して最適なインフルエンサーを見つけましょう"
      userEmail={user.email}
      onLogout={handleLogout}
    >
      <Card className="mb-6" padding="lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">検索フィルター</h2>
        <p className="text-gray-600">検索機能は開発中です。</p>
      </Card>

      <Card padding="lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">検索結果</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : influencers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {influencers.map((influencer) => (
              <div key={influencer.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg">{influencer.name}</h3>
                <p className="text-gray-600">{influencer.bio}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">検索条件に一致するインフルエンサーが見つかりませんでした。</p>
          </div>
        )}
      </Card>
    </PageLayout>
  );
};

export default SearchPage;