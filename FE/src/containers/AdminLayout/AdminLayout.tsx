"use client";
import AdminSidebar from "./components/AdminSidebar";
import SuperAdminSidebar from "./components/SuperAdminSidebar";
import AdminNavbar from "./components/AdminNavbar";
import "./AdminLayout.scss";
import { useLocation } from '../../hooks/navigation';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const pathname = useLocation().pathname || '';
  const showSuper = pathname.startsWith('/admin/super');

  return (
    <div className="admin-layout">

      {/* FIXED SIDEBAR */}
      <aside className={showSuper ? "admin-sidebar-fixed superadmin" : "admin-sidebar-fixed"}>
        {showSuper ? <SuperAdminSidebar /> : <AdminSidebar />}
      </aside>

      {/* MAIN RIGHT SECTION */}
      <div className="admin-content">
        <AdminNavbar />

        {/* ONLY THIS SCROLLS */}
        <div className="admin-page">
          {children}
        </div>
      </div>

    </div>
  );
};

export default AdminLayout;
