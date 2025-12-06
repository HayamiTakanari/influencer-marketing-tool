import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AchievementsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/influencer/achievements');
  }, [router]);
  return null;
}
