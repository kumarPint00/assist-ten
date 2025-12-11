'use client';

import { useRouter } from "next/navigation";
import { isAdmin } from "../../utils/adminUsers";
import React, { useEffect, useState } from "react";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const email = localStorage.getItem("loggedInUser");
    const token = localStorage.getItem("authToken");
    setUserEmail(email);
    setAuthToken(token);
    setIsLoading(false);
    
    if (!email || !token) {
      router.replace("/login");
    } else if (!isAdmin(email)) {
      router.replace("/app/dashboard");
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userEmail || !authToken || !isAdmin(userEmail)) {
    return null;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
