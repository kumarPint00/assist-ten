'use client';

import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "../../../hooks/navigation";
import { useEffect, useState } from "react";
import "./Navbar.scss";
import { isAdmin } from "../../../utils/adminUsers";
import { Logo } from '../../../components/ui';

const Navbar = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loggedUser, setLoggedUser] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
    setLoggedUser(localStorage.getItem("loggedInUser"));
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Box className="navbar">
      <Box className="navbar-left">
        <Logo />
      </Box>

      <Box className="navbar-links">
        <span onClick={() => scrollToSection("hero")}>Product</span>
        <span onClick={() => scrollToSection("features")}>Features</span>
        <span onClick={() => scrollToSection("pricing")}>Pricing</span>
      </Box>

      <Box className="navbar-actions">

        {/* ⭐ ADMIN DASHBOARD BUTTON (only for logged-in admins) */}
        {loggedUser && isAdmin(loggedUser) && (
          <Button
            variant="contained"
            className="admin-btn"
            onClick={() => navigate("/admin/dashboard")}
            style={{ marginRight: "12px" }}
          >
            Admin Dashboard
          </Button>
        )}

        {/* ⭐ LOGIN / EXPLORE BUTTON */}
        <Button
          variant="contained"
          className="navbar-btn"
          onClick={() => navigate(token ? "/app/profile-setup" : "/login")}
        >
          {token ? "Open App" : "Login"}
        </Button>

        <Button
          variant="outlined"
          className="navbar-secondary"
          onClick={() => navigate("/signup")}
          style={{ marginLeft: 8 }}
        >
          Start free trial
        </Button>
      </Box>
    </Box>
  );
};

export default Navbar;
