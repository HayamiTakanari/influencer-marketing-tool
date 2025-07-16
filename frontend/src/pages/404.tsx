import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-4">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          ページが見つかりません
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            ホームに戻る
          </Link>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            ダッシュボード
          </Link>
        </div>
      </motion.div>
    </div>
  );
}