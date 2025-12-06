import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * 古いURLからのリダイレクト
 * /my-applications → /influencer/applications
 */
export default function MyApplicationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/influencer/applications');
  }, [router]);

  return null;
}
