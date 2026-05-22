import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  LogOut,
  HelpCircle,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';

type Variant = 'admin' | 'staff';

type Props = {
  variant: Variant;
  className?: string;
  onNavigate?: () => void;
};

const linkBase =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-orange-50/90 transition hover:bg-white/10 hover:text-white';
const linkActive = 'bg-orange-600/35 text-white shadow-sm ring-1 ring-orange-500/40';

export function DashboardSidebar({ variant, className = '', onNavigate }: Props) {
  const { logout } = useAuth();
  const base = variant === 'admin' ? '/admin' : '/staff';

  const adminLinks = [
    { to: `${base}`, label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: `${base}/feedback`, label: 'All feedback', icon: MessageSquare, end: false },
    { to: `${base}/users`, label: 'Users', icon: Users, end: false },
  ];

  const staffLinks = [
    { to: `${base}`, label: 'My assignments', icon: ClipboardList, end: true },
  ];

  const links = variant === 'admin' ? adminLinks : staffLinks;

  return (
    <aside
      className={`flex h-full w-64 shrink-0 flex-col border-r border-orange-900/50 bg-gradient-to-b from-orange-950 via-stone-900 to-stone-950 text-white md:h-screen ${className}`}
    >
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-sm font-bold text-white shadow-md shadow-orange-900/40">
          F
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">FeedbackHub</p>
          <p className="text-xs text-orange-200/85">{variant === 'admin' ? 'Admin' : 'Staff'}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to + String(end)}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
          >
            <Icon className="h-5 w-5 shrink-0 opacity-90" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-white/10 p-3">
        <NavLink
          to={`${base}/profile`}
          onClick={onNavigate}
          className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ''}`}
        >
          <Settings className="h-5 w-5 shrink-0 opacity-90" />
          <span>Settings</span>
        </NavLink>
        <a href="#" className={linkBase} onClick={(e) => e.preventDefault()}>
          <HelpCircle className="h-5 w-5 shrink-0 opacity-90" />
          <span>Help center</span>
        </a>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            logout();
            window.location.href = '/login';
          }}
          className={`${linkBase} w-full text-left`}
        >
          <LogOut className="h-5 w-5 shrink-0 opacity-90" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
