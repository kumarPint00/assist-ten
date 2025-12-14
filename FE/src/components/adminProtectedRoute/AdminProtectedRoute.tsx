"use client";

import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { userService } from "../../API/services";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const pathname = usePathname();

  useEffect(() => {
    const email = localStorage.getItem("loggedInUser");
    const token = localStorage.getItem("authToken");
    setUserEmail(email);
    setAuthToken(token);

    const checkUser = async () => {
      if (!email || !token) {
        router.replace("/login");
        return;
      }
      try {
        const user = await userService.getCurrentUser();
        const role = user?.role || "user";
        if (role === "superadmin") {
          // If already on the superadmin route, allow rendering
          if (!pathname?.startsWith("/admin/super")) {
            router.replace("/admin/super");
            return;
          }
          // allow superadmin to render super pages
          setIsLoading(false);
          return;
        }
        if (role !== "admin") {
          router.replace("/app/dashboard");
          return;
        }
        setIsLoading(false);
      } catch (e) {
        // On error, redirect to login
        router.replace("/login");
      }
    };
    checkUser();
  }, [router, pathname]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userEmail || !authToken) {
    return null;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
