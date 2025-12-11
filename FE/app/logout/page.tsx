import Link from 'next/link';

export default function LogoutPage() {
  // This logout route has been archived; use the UI (Navbar / Sidebar) to logout instead.
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>Logout route archived</h2>
      <p>This route is deprecated; please use the in-app logout control (top-right menu).</p>
      <p>
        <Link href="/">Go to Home</Link>
      </p>
    </div>
  );
}