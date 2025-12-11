// NOTE: This logout helper has been archived; prefer in-app logout via UI controls (Navbar/Sidebar).
// It remains as a no-op helper to avoid accidental breakage if imported.
"use client";
import { useEffect } from "react";
import { useNavigate } from "../hooks/navigation";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Keep behaviour but warn when used; preserves existing functionality for legacy routes/components.
    console.warn("Deprecated: Logout component used. Use in-app logout modal instead.");
    localStorage.clear();
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default Logout;
