'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ProtectedProfileQuizRouteProps {
  children: React.ReactNode;
}

const ProtectedProfileQuizRoute = ({
  children,
}: ProtectedProfileQuizRouteProps) => {
  const router = useRouter();
  const [profileCompleted, setProfileCompleted] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const completed = localStorage.getItem("profileCompleted") === "true";
    setProfileCompleted(completed);
    setIsLoading(false);
    
    if (!completed) {
      router.replace("/app/profile-setup");
    }
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!profileCompleted) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedProfileQuizRoute;
