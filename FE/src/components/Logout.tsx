"use client";
import { useEffect } from "react";
import { useNavigate } from "../hooks/navigation";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default Logout;
