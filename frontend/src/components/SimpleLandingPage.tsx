import React from 'react';
import Link from 'next/link';
import { Header } from './common/Header';

const SimpleLandingPage: React.FC = () => {
  const concerns = [
    {
      icon: '🔍',
      title: 'インフルエンサーの探し方がわからない',
      subtitle: '誰をアサインすればいいかわからない'
    },
    {
      icon: '📈',
      title: 'インフルエンサーマーケの進め方がわからない、効率化したい',
      subtitle: 'キャスティングにおける注意点がわからない'
    }
  ];

  const pricingPlans = [
    {
      name: 'Freeプラン',
      price: '0円',
      description: 'まずは0円で使ってみる！',
      features: [
        '検索機能のみ',
        '※無料紹介投稿は可能'
      ],
      buttonText: 'まずは無料で始める',
      highlighted: false,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      name: 'Standardプラン',
      price: '1マッチング3万円',
      description: '謝礼が発生するもの',
      features: [
        'AI分析・提案機能',
        'メッセージング機能',
        'マッチング毎の課金'
      ],
      buttonText: '今すぐ始める',
      highlighted: true,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      name: 'Proプラン',
      price: '月額35万円',
      description: '全機能使い放題',
      features: [
        'Standard全機能',
        '無制限マッチング',
        '優先サポート'
      ],
      buttonText: '今すぐ始める',
      highlighted: false,
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* デザイン性の高い背景 */}
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
              {/* ミニマルな幾何学的形状 */}
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

      <Header />

      {/* ヒーローセクション */}
      <section className="pt-32 pb-20 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center relative">
          <h1 className="text-6xl md:text-7xl font-bold mb-12 relative opacity-100 transition-opacity duration-800">
            <span className="relative">
              <span className="text-gray-900 relative">
                InfluenceLink
              </span>
              {/* アクセントライン */}
              <svg className="absolute -bottom-2 left-0 w-full" height="20" viewBox="0 0 300 20" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="accent-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.6" />
                  </linearGradient>
                  <linearGradient id="accent-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
                  </linearGradient>
                </defs>
                <path d="M0,10 Q150,0 300,10" stroke="url(#accent-gradient-1)" strokeWidth="2" fill="none"/>
                <path d="M0,12 Q150,2 300,12" stroke="url(#accent-gradient-2)" strokeWidth="1" fill="none"/>
              </svg>
            </span>
          </h1>

          {/* お悩みセクション */}
          <div className="mb-12 opacity-100 transition-opacity duration-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
              {concerns.map((concern, index) => (
                <div
                  key={index}
                  className="relative bg-white border border-gray-200 p-8 transition-all group overflow-hidden hover:-translate-y-1 duration-300"
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
                  <div className="text-4xl mb-4 relative z-10">
                    {concern.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">
                    {concern.title}
                  </h3>
                  <p className="text-gray-600 relative z-10">
                    {concern.subtitle}
                  </p>
                  {/* ホバー時のアクセント */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ background: 'linear-gradient(90deg, #34d399, #14b8a6, #10b981, #059669)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* 装飾的な区切り線 */}
          <div className="flex items-center justify-center my-8">
            <div className="w-16 h-px bg-gray-300" />
            <div className="mx-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <defs>
                  <linearGradient id="center-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="side-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <rect x="8" y="8" width="4" height="4" fill="url(#center-gradient)" />
                <rect x="0" y="8" width="4" height="4" fill="#9CA3AF" />
                <rect x="16" y="8" width="4" height="4" fill="#9CA3AF" />
                <rect x="8" y="0" width="4" height="4" fill="url(#side-gradient)" />
                <rect x="8" y="16" width="4" height="4" fill="url(#side-gradient)" />
              </svg>
            </div>
            <div className="w-16 h-px bg-gray-300" />
          </div>

          {/* そのお悩みを解決します */}
          <div className="mb-8 opacity-100 transition-opacity duration-600">
            <h2 className="text-3xl md:text-4xl font-bold relative">
              <span className="text-gray-900 relative">
                そのお悩みを解決します！
              </span>
            </h2>
          </div>

          {/* Freeプラン登録CTA */}
          <div className="mb-16">
            <Link href="/register">
              <button
                className="relative text-white px-12 py-4 text-lg font-semibold overflow-hidden group hover:opacity-90 transition-opacity rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                  boxShadow: '5px 5px 0 rgba(16, 185, 129, 0.4), 3px 3px 15px rgba(16, 185, 129, 0.2)'
                }}
              >
                <span className="relative z-10">無料プランで今すぐ始める</span>
              </button>
            </Link>
            <p className="text-sm text-gray-600 mt-3">
              クレジットカード不要・即日利用可能
            </p>
          </div>

          {/* ツールの特徴 */}
          <div
            className="relative bg-white p-10 mb-20 max-w-3xl mx-auto border-2 border-gray-900 opacity-100 transition-opacity duration-600"
            style={{
              boxShadow: '10px 10px 0 rgba(0,0,0,0.12), 5px 5px 25px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.9)',
              background: 'linear-gradient(45deg, #f9fafb 25%, transparent 25%), linear-gradient(-45deg, #f9fafb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f9fafb 75%), linear-gradient(-45deg, transparent 75%, #f9fafb 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          >
            <h3 className="text-2xl font-bold mb-4 text-gray-900 relative">
              <span>
                ツールの特徴
              </span>
              {/* サブトルなアンダーライン */}
              <div className="absolute -bottom-1 left-0 w-8 h-0.5 opacity-80" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
            </h3>
            <p className="text-xl text-gray-700">
              ご予算や条件に合ったインフルエンサーを<br />
              <span className="font-bold text-gray-900">
                AIが分析し、ご提案します！
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 装飾的なセクション区切り */}
      <div className="relative h-20 bg-white">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,0 L0,60 Q300,90 600,60 T1200,60 L1200,0 Z" fill="#f9fafb" />
        </svg>
      </div>

      {/* 料金プラン */}
      <section className="py-20 px-4 bg-gray-50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 relative opacity-100 transition-opacity duration-600">
            <span>
              料金プラン
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white p-8 group transition-all flex flex-col hover:-translate-y-2 duration-300 ${
                  plan.highlighted
                    ? 'border-2 border-gray-900 shadow-xl'
                    : 'border border-gray-300 shadow-md'
                }`}
                style={{
                  boxShadow: plan.highlighted
                    ? '6px 6px 0 rgba(0,0,0,0.2), 2px 2px 15px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)'
                    : '3px 3px 0 rgba(0,0,0,0.1), 1px 1px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                  borderRadius: '0'
                }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 -right-3">
                    <div className="bg-black text-white px-4 py-2 text-sm font-bold"
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)'
                      }}
                    >
                      おすすめ
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {plan.price}
                  </div>
                  {plan.description && (
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  )}
                </div>

                <div className="flex-grow">
                  {plan.features.length > 0 && (
                    <ul className="mb-8 space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-gray-600 text-sm flex items-start">
                          <span className="mr-2 text-emerald-600">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link href="/register">
                  <button
                    className={`relative w-full py-3 font-medium transition-all overflow-hidden group hover:opacity-90 ${
                      plan.highlighted
                        ? 'text-white'
                        : 'bg-white text-gray-900 border-2 border-emerald-600'
                    }`}
                    style={plan.highlighted ? {
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      boxShadow: '3px 3px 0 rgba(0,0,0,0.25), 2px 2px 8px rgba(0,0,0,0.12)'
                    } : {
                      boxShadow: '3px 3px 0 rgba(0,0,0,0.25), 2px 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span className="relative z-10">{plan.buttonText}</span>
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <p
            className="text-center text-gray-600 mt-8 opacity-100 transition-opacity duration-600"
          >
            ※ 支払い方法はクレジットカードのみ
          </p>
        </div>
      </section>

      {/* 最終セクションの装飾 */}
      <div className="relative h-20 bg-gray-50">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 120">
          <path d="M0,60 Q300,30 600,60 T1200,60 L1200,120 L0,120 Z" fill="white" />
        </svg>
      </div>

      {/* CTA */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <Link href="/register">
              <button
                className="text-white px-16 py-6 text-xl font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                  boxShadow: '10px 10px 0 rgba(16, 185, 129, 0.4), 5px 5px 25px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span>まずは無料で始める</span>
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SimpleLandingPage;
