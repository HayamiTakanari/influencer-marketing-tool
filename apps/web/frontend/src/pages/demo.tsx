import React, { useState } from 'react';
import Link from 'next/link';
import BackButton from '../components/BackButton';

const DemoPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const demoSteps = [
    {
      title: 'インフルエンサー検索',
      description: '条件に合うインフルエンサーを見つけましょう',
      image: '🔍',
      content: 'フォロワー数、カテゴリー、地域などの条件でインフルエンサーを検索できます。AIが最適なマッチングを提案します。'
    },
    {
      title: 'プロフィール確認',
      description: '詳細なプロフィールと実績を確認',
      image: '📊',
      content: 'インフルエンサーの過去の投稿、エンゲージメント率、フォロワー属性などを詳しく確認できます。'
    },
    {
      title: 'メッセージ送信',
      description: 'リアルタイムでコミュニケーション',
      image: '💬',
      content: 'チャット機能で直接やり取りができます。ファイル共有や音声通話も可能です。'
    },
    {
      title: '契約・支払い',
      description: '安全な決済システム',
      image: '💳',
      content: 'Stripe統合による安全な決済。契約書の作成から支払いまで一括管理できます。'
    },
    {
      title: '効果測定',
      description: 'キャンペーンの効果を分析',
      image: '📈',
      content: 'インプレッション、エンゲージメント、コンバージョンなどの効果を詳細に分析できます。'
    }
  ];

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              IM Tool
            </Link>
            <BackButton text="ホームに戻る" fallbackUrl="/" />
          </div>
          <Link href="/register">
            <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all">
              始める
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* タイトル */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              プラットフォームデモ
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            インフルエンサーマッチングツールの使い方をご紹介
          </p>
        </div>

        {/* プログレスバー */}
        <div className="mb-12">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              {demoSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-blue-500 w-8'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-center text-sm text-gray-500">
            {currentStep + 1} / {demoSteps.length}
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 左側：説明 */}
          <div
            key={currentStep}
            className="space-y-6"
          >
            <div className="text-8xl text-center lg:text-left">
              {demoSteps[currentStep].image}
            </div>
            <h2 className="text-4xl font-bold text-gray-900">
              {demoSteps[currentStep].title}
            </h2>
            <p className="text-xl text-gray-600">
              {demoSteps[currentStep].description}
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              {demoSteps[currentStep].content}
            </p>
          </div>

          {/* 右側：デモ画面 */}
          <div
            key={currentStep}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl"
          >
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">{demoSteps[currentStep].image}</div>
                <div className="text-2xl font-bold text-gray-600">
                  {demoSteps[currentStep].title}
                </div>
                <div className="text-gray-500 mt-2">
                  デモ画面
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="flex justify-between items-center mt-16">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all ${
              currentStep === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ← 前へ
          </button>

          <div className="flex space-x-4">
            <Link href="/register">
              <button className="px-8 py-4 border-2 border-blue-500 text-blue-500 rounded-2xl font-semibold hover:bg-blue-50 hover:scale-105 transition-all">
                今すぐ始める
              </button>
            </Link>
          </div>

          <button
            onClick={nextStep}
            disabled={currentStep === demoSteps.length - 1}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all ${
              currentStep === demoSteps.length - 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
            }`}
          >
            次へ →
          </button>
        </div>

        {/* 機能一覧 */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
            すべての機能
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {demoSteps.map((step, index) => (
              <div
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`cursor-pointer p-6 rounded-2xl border-2 transition-all ${
                  index === currentStep
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white/80 hover:border-gray-300'
                }`}
              >
                <div className="text-4xl text-center mb-3">{step.image}</div>
                <h4 className="font-semibold text-center text-gray-900">
                  {step.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;