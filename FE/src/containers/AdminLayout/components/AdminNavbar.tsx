"use client";
import { useState, useEffect } from "react";
import { userService } from '../../../API/services';
import { FaBell, FaUserCircle } from "react-icons/fa";
import "./AdminNavbar.scss";
import { Menu, MenuItem, Dialog, DialogTitle, DialogActions, Button } from "@mui/material";
import { useNavigate, useLocation } from "../../../hooks/navigation";

const AdminNavbar = () => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const settings = (() => {
    try { return JSON.parse(localStorage.getItem('admin.settings') || '{}'); } catch { return {}; }
  })();
  const provider = settings.llmProvider || 'groq';
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const location = useLocation();
  const pageTitle = location.pathname?.startsWith('/admin/super') ? 'Super Admin Panel' : 'Admin Dashboard';

  useEffect(() => {
    (async () => {
      try {
        const user = await userService.getCurrentUser();
        setRole(user?.role || null);
        setUserEmail(user?.email || null);
      } catch (e) {
        setRole(null);
      }
    })();
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const openLogoutDialog = () => {
    setShowLogoutDialog(true);
    handleMenuClose();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <div className="admin-navbar">
        <div className="admin-left">
          <div className="admin-logo" aria-hidden>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="5" fill="#4f46e5" />
              <path d="M7 12h10M7 8h10M7 16h6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="admin-title">{pageTitle}</h2>
        </div>

        <div className="admin-icons">
          <div className="nav-notification" aria-hidden>
            <FaBell className="nav-icon" size={18} aria-label="Notifications" />
            <div className="notif-dot" aria-hidden />
          </div>
          <div className="llm-badge" onClick={() => navigate('/admin/settings')} title={`LLM ${provider} - ${settings?.useLLMDefault ? 'On' : 'Off'}`} role="button" tabIndex={0} aria-pressed={settings?.useLLMDefault ? true : false}>
            <span aria-hidden>🤖</span>
            <span className="llm-text">{provider.toUpperCase()}</span>
            <span className="llm-status">{settings?.useLLMDefault ? 'On' : 'Off'}</span>
          </div>

          {/* USER ICON */}
            <div className="user-icon-wrapper" onClick={handleMenuOpen}>
            <FaUserCircle className="nav-icon" size={26} />
          </div>
            {userEmail && (
              <div className="user-email">{userEmail}</div>
            )}
            {role && (
              <div className="user-role">{role.toUpperCase()}</div>
            )}
        </div>
      </div>

      {/* USER MENU DROPDOWN */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        {userEmail && <MenuItem disabled sx={{ opacity: 0.8 }}>{userEmail}</MenuItem>}
        <MenuItem onClick={openLogoutDialog} sx={{ color: "red" }}>
          Logout
        </MenuItem>
      </Menu>

      {/* CONFIRM LOGOUT POPUP */}
      <Dialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)}>
        <DialogTitle>Are you sure you want to logout?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleLogout}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminNavbar;
