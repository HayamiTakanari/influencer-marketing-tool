import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  client: {
    companyName: string;
  };
  matchedInfluencer: {
    displayName: string;
    user: {
      id: string;
    };
  };
}

const CheckoutForm: React.FC<{
  project: Project;
  amount: number;
  onSuccess: () => void;
}> = ({ project, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: project.id,
          amount: amount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement!,
          billing_details: {
            name: project.client.companyName,
          },
        }
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
      } else {
        // Confirm payment on backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/confirm-payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentIntentId: clientSecret.split('_secret')[0],
            projectId: project.id
          })
        });

        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-gray-300 rounded-xl">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <button


        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '処理中...' : `¥${amount.toLocaleString()}を支払う`}
      </button>
    </form>
  );
};

const PaymentPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState(0);
  const [fee, setFee] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const { projectId } = router.query;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // 企業ユーザーのみアクセス可能
      if (parsedUser.role !== "COMPANY") {
        router.push('/dashboard');
        return;
      }
      
      if (projectId) {
        fetchProjectDetails();
      }
    } else {
      router.push('/login');
    }
  }, [projectId, router]);

  const fetchProjectDetails = async () => {
    try {
      const { getProjectById } = await import('../../services/api');
      const result = await getProjectById(projectId as string);
      setProject(result);
      setAmount(result.budget);
      setFee(Math.round(result.budget * 0.1));
    } catch (err: any) {
      console.error('Error fetching project details:', err);
      setError('プロジェクトの取得に失敗しました。');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowSuccess(true);
  };

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

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error || 'プロジェクトが見つかりませんでした。'}</p>
          <Link href="/projects" className="text-blue-600 hover:underline">
            プロジェクト一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div


          className="text-center bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-12 shadow-xl max-w-md"
        >
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">支払い完了！</h2>
          <p className="text-gray-600 mb-6">
            {project.title}の支払いが正常に処理されました。
          </p>
          <div className="space-y-3">
            <Link href="/projects">
              <span className="inline-block w-full">
                <button


                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  プロジェクト一覧に戻る
                </button>
              </span>
            </Link>
            <Link href="/payments/history">
              <span className="inline-block w-full">
                <button className="w-full px-6 py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition-colors">
                  支払い履歴を見る
                </button>
              </span>
            </Link>
          </div>
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
            <Link href="/projects" className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">←</span>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">決済</h1>
              <p className="text-sm text-gray-600">プロジェクトの支払い処理</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* プロジェクト詳細 */}
        <div



          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">支払い詳細</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">プロジェクト</span>
              <span className="font-semibold text-gray-900">{project.title}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">インフルエンサー</span>
              <span className="font-semibold text-gray-900">{project.matchedInfluencer.displayName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">基本料金</span>
              <span className="font-semibold text-gray-900">¥{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">プラットフォーム手数料 (10%)</span>
              <span className="font-semibold text-gray-900">¥{fee.toLocaleString()}</span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">合計</span>
              <span className="text-2xl font-bold text-green-600">¥{(amount + fee).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-blue-600 text-lg">💳</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">安全な決済</h4>
                <p className="text-blue-700 text-sm">
                  Stripeを使用してセキュアに処理されます。カード情報は保存されません。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 決済フォーム */}
        <div



          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">カード情報</h3>
          
          <Elements stripe={stripePromise}>
            <CheckoutForm
              project={project}
              amount={amount + fee}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>支払いを完了すると、プロジェクトが完了状態になります。</p>
          </div>
        </div>

        {/* セキュリティ情報 */}
        <div



          className="bg-gray-50/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl mt-8"
        >
          <h4 className="font-semibold text-gray-900 mb-3">🔒 セキュリティとプライバシー</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• すべての決済情報はSSLで暗号化されています</p>
            <p>• カード情報は当社サーバーに保存されません</p>
            <p>• Stripe社の世界最高水準のセキュリティを使用</p>
            <p>• PCI DSS レベル1準拠</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;