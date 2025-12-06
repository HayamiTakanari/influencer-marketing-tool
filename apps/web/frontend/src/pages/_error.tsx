import { NextPageContext } from 'next';
import Link from 'next/link';

interface ErrorProps {
  statusCode: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          {statusCode}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {statusCode === 404
            ? 'ページが見つかりません'
            : 'エラーが発生しました'}
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;