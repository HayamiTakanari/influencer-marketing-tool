import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import LoadingState from '../components/common/LoadingState';

export const withAuth = (WrappedComponent: any, allowedRoles?: string[]) => {
  return function ProtectedComponent(props: any) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!userData || !token) {
        // Not authenticated - redirect to login
        router.push('/login');
        return;
      }

      if (allowedRoles) {
        const user = JSON.parse(userData);
        if (!allowedRoles.includes(user.role)) {
          // Wrong role - redirect to appropriate dashboard
          if (user.role === 'INFLUENCER') {
            router.push('/influencer/dashboard');
          } else {
            router.push('/company/dashboard');
          }
          return;
        }
      }

      setIsAuthenticated(true);
      setIsLoading(false);
    }, []);

    if (isLoading) {
      return <LoadingState />;
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};
