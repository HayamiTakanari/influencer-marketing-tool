import React, { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CompanyProfilePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/company/profile');
  }, [router]);
  return null;
}
