import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface User {
  email: string;
  role: string;
  type: string;
}

export const useAuth = (requiredRoles: string[] = []) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      const userWithType = {
        email: parsedUser.email,
        role: parsedUser.role,
        type: parsedUser.role === 'INFLUENCER' ? 'influencer' : "company"
      };

      // 権限チェック
      if (requiredRoles.length > 0 && !requiredRoles.includes(parsedUser.role)) {
        router.push('/dashboard');
        return;
      }

      setUser(userWithType);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return { user, isLoading };
};