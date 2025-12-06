import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SearchSimplePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/company/influencers/search');
  }, [router]);
  return null;
}
