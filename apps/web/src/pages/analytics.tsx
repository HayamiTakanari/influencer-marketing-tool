import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AnalyticsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/influencer/analytics');
  }, [router]);
  return null;
}
