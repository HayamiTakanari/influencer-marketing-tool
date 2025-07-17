// ダッシュボードナビゲーション修正パッチ

// 現在の問題: Next.js の Link コンポーネントが機能していない可能性
// 解決策: onClick イベントハンドラーを追加

const handleNavigation = (path) => {
  window.location.href = path;
};

// または useRouter を使用
import { useRouter } from 'next/router';

const router = useRouter();

const handleNavigation = (path) => {
  router.push(path);
};

// 修正例:
<motion.div
  onClick={() => handleNavigation('/search')}
  className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
>
  <div className="text-4xl mb-4">🔍</div>
  <h3 className="text-xl font-bold text-gray-900 mb-2">インフルエンサー検索</h3>
  <p className="text-gray-600">条件に合うインフルエンサーを探す</p>
</motion.div>