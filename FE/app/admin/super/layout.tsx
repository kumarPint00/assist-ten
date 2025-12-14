import SuperAdminProtectedRoute from '../../../src/components/SuperAdminProtectedRoute/SuperAdminProtectedRoute';
import AdminLayout from '../../../src/containers/AdminLayout';

export default function SuperLayout({ children } : { children: React.ReactNode }) {
  return (
    <SuperAdminProtectedRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </SuperAdminProtectedRoute>
  )
}
