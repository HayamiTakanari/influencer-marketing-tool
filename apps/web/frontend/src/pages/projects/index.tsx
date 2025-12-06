import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * 古いURLからの自動リダイレクトページ
 * /projects → /company/projects/list または /influencer/opportunities
 */
export default function ProjectsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === "COMPANY" || parsedUser.role === 'COMPANY') {
        router.replace('/company/projects/list');
      } else if (parsedUser.role === 'INFLUENCER') {
        router.replace('/influencer/opportunities');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
