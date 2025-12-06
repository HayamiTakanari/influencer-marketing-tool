import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  refundPayment,
  getPaymentStats,
} from '../services/api';
import { Transaction } from '../types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentInterfaceProps {
  projectId?: string;
  amount?: number;
  onPaymentSuccess?: () => void;
}

const PaymentInterface: React.FC<PaymentInterfaceProps> = ({
  projectId,
  amount,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'payment' | 'history' | 'stats'>('payment');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('payment')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              支払い
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              支払い履歴
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              統計
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'payment' && (
            <Elements stripe={stripePromise}>
              <PaymentForm
                projectId={projectId}
                amount={amount}
                onPaymentSuccess={onPaymentSuccess}
              />
            </Elements>
          )}
          
          {activeTab === 'history' && <PaymentHistory />}
          
          {activeTab === 'stats' && <PaymentStats />}
        </div>
      </div>
    </div>
  );
};

const PaymentForm: React.FC<{
  projectId?: string;
  amount?: number;
  onPaymentSuccess?: () => void;
}> = ({ projectId, amount, onPaymentSuccess }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(amount || 0);
  const stripe = useStripe();
  const elements = useElements();

  const createPaymentIntentMutation = useMutation({
    mutationFn: createPaymentIntent,
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: confirmPayment,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !projectId) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await createPaymentIntentMutation.mutateAsync({
        projectId,
        amount: paymentAmount,
      });

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else {
        // Confirm on server
        await confirmPaymentMutation.mutateAsync({
          paymentIntentId,
          projectId,
        });

        onPaymentSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">支払い処理</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            支払い金額（円）
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カード情報
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">支払い金額</span>
            <span className="text-sm font-medium">¥{paymentAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">手数料（10%）</span>
            <span className="text-sm font-medium">¥{(paymentAmount * 0.1).toLocaleString()}</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-900">合計</span>
              <span className="text-base font-medium text-gray-900">
                ¥{(paymentAmount * 1.1).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || processing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {processing ? '処理中...' : '支払いを実行'}
        </button>
      </form>
    </div>
  );
};

const PaymentHistory: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: getPaymentHistory,
  });

  const refundMutation = useMutation({
    mutationFn: refundPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '完了';
      case 'pending':
        return '処理中';
      case 'failed':
        return '失敗';
      case 'refunded':
        return '返金済み';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">支払い履歴</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            支払い履歴がありません
          </h3>
          <p className="text-gray-600">
            初回の支払いを行うとここに表示されます
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction: Transaction) => (
            <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {transaction.project.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {transaction.project.client?.companyName || 
                     transaction.project.matchedInfluencer?.displayName}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    ¥{transaction.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    手数料: ¥{transaction.fee.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {getStatusText(transaction.status)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(transaction.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </span>
                </div>
                
                {transaction.status === 'completed' && (
                  <button
                    onClick={() => refundMutation.mutate(transaction.id)}
                    disabled={refundMutation.isPending}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    返金
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PaymentStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['paymentStats'],
    queryFn: getPaymentStats,
  });

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">支払い統計</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  総支払い額
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  ¥{stats?.totalSpent.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  総収益
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  ¥{stats?.totalEarned.toLocaleString() || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  完了した取引
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats?.completedTransactions || 0}件
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInterface;