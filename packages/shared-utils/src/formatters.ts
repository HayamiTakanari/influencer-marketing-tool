/**
 * フォーマッターユーティリティ
 */

export const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
  const formatter = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency,
  });
  return formatter.format(amount);
};

export const formatDate = (date: Date | string, locale: string = 'ja-JP'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale);
};

export const formatDateTime = (
  date: Date | string,
  locale: string = 'ja-JP'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(locale);
};

export const formatFollowerCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

export const formatEngagementRate = (rate: number): string => {
  return `${rate.toFixed(2)}%`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
