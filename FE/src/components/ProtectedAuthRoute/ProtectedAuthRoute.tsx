'use client';

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface ProtectedAuthRouteProps {
  children: React.ReactNode;
}

const ProtectedAuthRoute = ({ children }: ProtectedAuthRouteProps) => {
  const router = useRouter();
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    setToken(authToken);
    setIsLoading(false);
    
    if (authToken) {
      router.replace("/app/profile-setup");
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (token) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedAuthRoute;
