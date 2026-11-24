import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { AdminAuthProvider } from '@/features/admin/AdminAuth';
import { AdminLoading } from '@/features/admin/ui';

/** Racine `/admin` : fournit le contexte d'auth à tout le back-office. */
export default function AdminRoot() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<AdminLoading />}>
        <Outlet />
      </Suspense>
    </AdminAuthProvider>
  );
}
