import SuperAdminProtectedRoute from '../../../src/components/SuperAdminProtectedRoute/SuperAdminProtectedRoute';

export default function SuperLayout({ children } : { children: React.ReactNode }) {
  // `app/admin/layout.tsx` already wraps admin routes with `AdminLayout`,
  // so we should not re-wrap here to avoid double-rendering the admin navbar.
  return (
    <SuperAdminProtectedRoute>
      {children}
    </SuperAdminProtectedRoute>
  )
}
