import Link from 'next/link';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/shared/Button';

export default function Custom404() {
  return (
    <DashboardLayout
      title="404"
      subtitle="ページが見つかりません"
    >
      <div className="text-center">
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600 mb-4">
          404
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="primary" size="lg">
              ホームに戻る
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              ダッシュボード
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}