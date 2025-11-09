import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RevenuePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/influencer/revenue');
  }, [router]);
  return null;
}
