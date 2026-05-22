import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Bell, Menu, Search, Settings } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.toString() || 'http://localhost:5000';

function avatarSrc(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}

type Props = {
  onOpenMobileMenu?: () => void;
};

export function DashboardTopbar({ onOpenMobileMenu }: Props) {
  const { user } = useAuth();
  const profilePath = user?.role === 'admin' ? '/admin/profile' : '/staff/profile';
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Account';
  const src = avatarSrc(user?.avatarUrl ?? null);
  const initial = displayName.charAt(0).toUpperCase();

  const [pendingComplaints, setPendingComplaints] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (user?.role !== 'admin') {
      setPendingComplaints(0);
      return;
    }
    try {
      const res = await api.notifications.adminSummary();
      setPendingComplaints(res.pendingComplaints);
    } catch {
      setPendingComplaints(0);
    }
  }, [user?.role]);

  useEffect(() => {
    loadNotifications();
    const id = window.setInterval(loadNotifications, 25000);
    const onFocus = () => loadNotifications();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadNotifications]);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-orange-100/80 bg-white px-3 shadow-sm sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            className="rounded-lg p-2 text-stone-600 hover:bg-orange-50 md:hidden"
            aria-label="Open menu"
            onClick={onOpenMobileMenu}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-orange-100 ring-2 ring-orange-200/80">
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-orange-800">
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">{displayName}</p>
          <p className="truncate text-xs text-stone-500">{user?.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Search"
            className="w-48 rounded-full border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/25 lg:w-64"
            readOnly
            aria-label="Search (coming soon)"
          />
        </div>
        {user?.role === 'admin' ? (
          <Link
            to="/admin/feedback?status=pending&type=complaint"
            className="relative rounded-full p-2 text-stone-500 transition hover:bg-orange-50 hover:text-orange-700"
            aria-label={`Notifications, ${pendingComplaints} pending complaints`}
          >
            <Bell className="h-5 w-5" />
            {pendingComplaints > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white">
                {pendingComplaints > 99 ? '99+' : pendingComplaints}
              </span>
            )}
          </Link>
        ) : (
          <span
            className="relative rounded-full p-2 text-stone-400"
            aria-hidden
            title="Notifications are for admins"
          >
            <Bell className="h-5 w-5" />
          </span>
        )}
        <Link
          to={profilePath}
          className="rounded-full p-2 text-stone-500 transition hover:bg-orange-50 hover:text-orange-700"
          aria-label="Account settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
