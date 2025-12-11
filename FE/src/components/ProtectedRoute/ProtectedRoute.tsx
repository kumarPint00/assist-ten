'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    setToken(authToken);
    setIsLoading(false);
    
    if (!authToken) {
      router.replace("/login");
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>; // or your loading component
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
