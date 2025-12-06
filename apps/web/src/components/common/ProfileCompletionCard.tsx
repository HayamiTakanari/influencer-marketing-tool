import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Card from '../shared/Card';
import LoadingState from './LoadingState';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface ProfileCompletionData {
  completionPercentage: number;
  completedFields: { name: string; key: string }[];
  missingFields: { name: string; key: string; weight: number }[];
  stats: {
    totalFields: number;
    completedCount: number;
    missingCount: number;
  };
}

interface ProfileCompletionCardProps {
  onNavigateToProfile?: () => void;
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ onNavigateToProfile }) => {
  const [completion, setCompletion] = useState<ProfileCompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { handleError } = useErrorHandler();

  useEffect(() => {
    fetchProfileCompletion();
  }, []);

  const fetchProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/profile/me/completion`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Suppress all error messages
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
        // Silently handle any non-200 response
        setError('');
        setCompletion(null);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setCompletion(data);
      setError('');
    } catch (err: any) {
      // Silently handle all errors without logging to console
      setError('');
      setCompletion(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <LoadingState />
      </Card>
    );
  }

  if (error || !completion) {
    return null;
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getFieldTab = (fieldKey: string): string => {
    const tabMapping: Record<string, string> = {
      'displayName': 'basic',
      'bio': 'basic',
      'categories': 'basic',
      'prefecture': 'basic',
      'city': 'basic',
      'priceMin': 'basic',
      'priceMax': 'basic',
      'gender': 'basic',
      'phoneNumber': 'basic',
      'address': 'basic',
      'socialAccounts': 'social',
      'portfolio': 'portfolio',
      'invoiceInfo': 'invoice',
      'workingStatus': 'working'
    };
    return tabMapping[fieldKey] || 'basic';
  };

  const handleFieldClick = (fieldKey: string) => {
    const tab = getFieldTab(fieldKey);
    router.push(`/profile?tab=${tab}`);
  };

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">プロフィール完成度</h3>
          <span className={`text-2xl font-bold ${getCompletionColor(completion.completionPercentage)}`}>
            {completion.completionPercentage}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(completion.completionPercentage)}`}
            style={{ width: `${completion.completionPercentage}%` }}
          ></div>
        </div>

        <div className="text-sm text-gray-600">
          <p>{completion.stats.completedCount} / {completion.stats.totalFields} 項目完了</p>
        </div>

        {completion.missingFields.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">未入力項目</h4>
            <ul className="space-y-1">
              {completion.missingFields.slice(0, 5).map((field, idx) => (
                <li 
                  key={idx} 
                  onClick={() => handleFieldClick(field.key)}
                  className="text-sm text-gray-600 flex items-center hover:text-emerald-600 cursor-pointer transition-colors group"
                >
                  <span className="w-2 h-2 bg-gray-400 group-hover:bg-emerald-500 rounded-full mr-2 transition-colors"></span>
                  <span className="group-hover:underline">{field.name}</span>
                </li>
              ))}
              {completion.missingFields.length > 5 && (
                <li className="text-sm text-gray-500 italic">
                  他 {completion.missingFields.length - 5} 項目
                </li>
              )}
            </ul>
          </div>
        )}

        {completion.completionPercentage < 100 && onNavigateToProfile && (
          <button
            onClick={onNavigateToProfile}
            className="w-full mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
          >
            プロフィールを完成させる
          </button>
        )}

        {completion.completionPercentage === 100 && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-emerald-800 font-medium">
              🎉 プロフィールが完璧です！
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProfileCompletionCard;
