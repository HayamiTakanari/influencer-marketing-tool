import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = React.memo(({
  items,
  className = '',
  showHome = true
}) => {
  const router = useRouter();

  const defaultItems: BreadcrumbItem[] = showHome
    ? [{ label: 'ホーム', href: '/dashboard' }, ...items]
    : items;

  return (
    <nav
      className={`flex items-center gap-0 text-xs ${className}`}
      aria-label="ブレッドクラムナビゲーション"
    >
      {defaultItems.map((item, index) => {
        const isLast = index === defaultItems.length - 1;
        const isFirst = index === 0;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-0">
            {!isFirst && (
              <span className="text-gray-400 px-1">/</span>
            )}

            {isLast ? (
              <span className="text-gray-700 font-medium truncate">
                {item.label}
              </span>
            ) : item.href ? (
              <Link href={item.href} className="text-blue-600 hover:text-blue-700 hover:underline truncate transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-600 truncate">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
});

BreadcrumbNav.displayName = 'BreadcrumbNav';

export default BreadcrumbNav;
