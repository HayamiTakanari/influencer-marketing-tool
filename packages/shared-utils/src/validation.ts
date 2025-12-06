/**
 * バリデーションユーティリティ
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  score: number;
  issues: string[];
} => {
  const issues: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    issues.push('8文字以上である必要があります');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    issues.push('小文字を含む必要があります');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    issues.push('大文字を含む必要があります');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    issues.push('数字を含む必要があります');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  }

  return {
    isValid: score >= 4,
    score,
    issues,
  };
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\-\+\s\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const isValidBudget = (budget: number): boolean => {
  return budget > 0 && budget <= 100000000; // 最大1億円
};

export const isValidFollowerCount = (count: number): boolean => {
  return count >= 0 && Number.isInteger(count);
};
