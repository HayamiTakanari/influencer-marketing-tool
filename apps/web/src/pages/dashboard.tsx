import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

const DashboardPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    // ロール別にリダイレクト
    if (parsedUser.role === 'INFLUENCER') {
      router.push('/influencer/dashboard');
    } else if (parsedUser.role === "COMPANY" || parsedUser.role === 'COMPANY') {
      router.push('/company/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return null;
};

export default DashboardPage;
