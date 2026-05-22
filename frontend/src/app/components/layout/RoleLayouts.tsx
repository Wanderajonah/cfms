import { DashboardShell } from './DashboardShell';
import { RequireAuth } from '../../lib/auth';

export function AdminLayout() {
  return (
    <RequireAuth role="admin">
      <DashboardShell variant="admin" />
    </RequireAuth>
  );
}

export function StaffLayout() {
  return (
    <RequireAuth role="staff">
      <DashboardShell variant="staff" />
    </RequireAuth>
  );
}
