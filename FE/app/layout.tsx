import type { Metadata } from 'next';
import ClientLayout from './ClientLayout';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'AI Learning Assessment Platform',
  description: 'AI-powered learning and assessment platform for skill evaluation and course recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}