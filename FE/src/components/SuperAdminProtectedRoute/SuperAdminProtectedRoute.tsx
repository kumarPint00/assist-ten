"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '../../API/services';

const SuperAdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const user = await userService.getCurrentUser();
        if (!user || user.role !== 'superadmin') {
          router.replace('/admin');
          return;
        }
      } catch (e) {
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };
    check();
  }, [router]);

  if (isLoading) return <div>Loading...</div>;
  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
