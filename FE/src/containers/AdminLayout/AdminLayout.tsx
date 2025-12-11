import AdminSidebar from "./components/AdminSidebar";
import AdminNavbar from "./components/AdminNavbar";
import "./AdminLayout.scss";

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="admin-layout">

      {/* FIXED SIDEBAR */}
      <aside className="admin-sidebar-fixed">
        <AdminSidebar />
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
