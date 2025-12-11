import AdminProtectedRoute from '../../src/components/adminProtectedRoute/AdminProtectedRoute';
import AdminLayout from '../../src/containers/AdminLayout';

export default function AdminLayoutComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminProtectedRoute>
  );
}