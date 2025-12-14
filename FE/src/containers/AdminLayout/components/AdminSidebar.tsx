"use client";
import NavLink from "../../../components/NavLink/NavLink";
import "./AdminSidebar.scss";
import React, { useEffect, useState } from "react";
import { userService } from "../../../API/services";

const AdminSidebar = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await userService.getCurrentUser();
        setRole(user?.role || null);
      } catch (e) {
        setRole(null);
      }
    })();
  }, []);

  return (
    <div className="admin-sidebar">
      <div className="admin-logo">Admin Panel</div>

      <nav className="admin-nav">
        <div className="admin-section">
          <p className="section-title">Core</p>
          <NavLink to="/admin/dashboard" className="admin-link">
            Dashboard
          </NavLink>
          <NavLink to="/admin/assessment" className="admin-link">
            Assessment Creation
          </NavLink>
        </div>

        <div className="admin-section">
          <p className="section-title">Candidates</p>
          <NavLink to="/admin/candidates" className="admin-link">
            Candidate Management
          </NavLink>
          <NavLink to="/candidate" className="admin-link">
            Candidate experience
          </NavLink>
          <NavLink to="/admin/add-candidate" className="admin-link">
            Add Candidate
          </NavLink>
        </div>

        <div className="admin-section">
          <p className="section-title">Requirements</p>
          <NavLink to="/admin/requirement/creation" className="admin-link">
            Requirement Creation
          </NavLink>
          <NavLink to="/admin/requirement/summary" className="admin-link">
            Live requirements
          </NavLink>
          <NavLink to="/admin/requirement/management" className="admin-link">
            Requirement management
          </NavLink>
        </div>

        <div className="admin-section">
          <p className="section-title">Operations</p>
          <NavLink to="/admin/skill-checker" className="admin-link">
            Skill Matching Checker
          </NavLink>
          <NavLink to="/admin/settings" className="admin-link">
            Settings
          </NavLink>
          <NavLink to="/admin/interviews" className="admin-link">
            Interviews tracker
          </NavLink>
          <NavLink to="/admin/team" className="admin-link">
            Team & Roles
          </NavLink>
          <NavLink to="/admin/proctoring" className="admin-link">
            Proctoring review
          </NavLink>
          <NavLink to="/admin/billing" className="admin-link">
            Billing & usage
          </NavLink>
          <NavLink to="/admin/results" className="admin-link">
            Results & Reports
          </NavLink>
        </div>

        {role === "superadmin" && (
          <div className="admin-section">
            <p className="section-title">Super Admin</p>
            <NavLink to="/admin/super" className="admin-link">
              Super Admin Panel
            </NavLink>
          </div>
        )}
      </nav>
    </div>
  );
};

export default AdminSidebar;
