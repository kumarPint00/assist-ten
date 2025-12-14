'use client';

import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "../../../hooks/navigation";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import "./Navbar.scss";
import { userService } from '../../../API/services';
import { Logo } from '../../../components/ui';

const Navbar = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [loggedUser, setLoggedUser] = useState<string | null>(null);
  const [isAdminFlag, setIsAdminFlag] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const { scrollY } = useScroll();
  const backgroundOpacity = useTransform(scrollY, [0, 100], [0, 0.8]);
  const backdropBlur = useTransform(scrollY, [0, 100], [0, 10]);

  useEffect(() => {
    setToken(localStorage.getItem("authToken"));
    const email = localStorage.getItem("loggedInUser");
    setLoggedUser(email);
    const fetchUser = async () => {
      if (!email) return;
      try {
        const user = await userService.getCurrentUser();
        const role = user?.role || 'user';
        setIsAdminFlag(role === 'admin' || role === 'superadmin');
      } catch (e) {
        // ignore
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Update active section based on scroll position
      const sections = ["hero", "features", "pricing", "demo"];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (currentSection) setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navItems = [
    { id: "hero", label: "Product" },
    { id: "features", label: "Features" },
    { id: "pricing", label: "Pricing" }
  ];

  return (
    <motion.div
      className={`navbar ${isScrolled ? 'scrolled' : ''}`}
      style={{
        backgroundColor: backgroundOpacity,
        backdropFilter: backdropBlur,
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box className="navbar-left">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Logo />
        </motion.div>
      </Box>

      <Box className="navbar-links">
        {navItems.map((item) => (
          <motion.span
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={activeSection === item.id ? 'active' : ''}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {item.label}
            {activeSection === item.id && (
              <motion.div
                className="active-indicator"
                layoutId="activeIndicator"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.span>
        ))}
      </Box>

      <Box className="navbar-actions">
        {/* ⭐ ADMIN DASHBOARD BUTTON (only for logged-in admins) */}
        {loggedUser && isAdminFlag && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              className="admin-btn"
              onClick={() => navigate("/admin/dashboard")}
              style={{ marginRight: "12px" }}
            >
              Admin Dashboard
            </Button>
          </motion.div>
        )}

        {/* ⭐ LOGIN / EXPLORE BUTTON */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="contained"
            className="navbar-btn"
            onClick={() => navigate(token ? "/app/profile-setup" : "/login")}
          >
            {token ? "Open App" : "Login"}
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="outlined"
            className="navbar-secondary"
            onClick={() => navigate("/signup")}
            style={{ marginLeft: 8 }}
          >
            Start free trial
          </Button>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default Navbar;
