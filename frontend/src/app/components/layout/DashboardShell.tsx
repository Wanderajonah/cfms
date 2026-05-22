import { useState } from 'react';
import { Outlet } from 'react-router';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';

type Variant = 'admin' | 'staff';

export function DashboardShell({ variant }: { variant: Variant }) {
  const [mobileNav, setMobileNav] = useState(false);

  return (
  <div className="flex h-screen overflow-hidden bg-gradient-to-br from-orange-50/80 via-stone-50 to-white">
      <DashboardSidebar variant={variant} className="hidden md:flex" />

      {mobileNav && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <DashboardSidebar variant={variant} onNavigate={() => setMobileNav(false)} />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar onOpenMobileMenu={() => setMobileNav(true)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
