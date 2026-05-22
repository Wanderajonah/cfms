interface BadgeProps {
  status: 'pending' | 'resolved' | 'in-progress' | 'escalated';
  children: React.ReactNode;
}

export function Badge({ status, children }: BadgeProps) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
    escalated: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {children}
    </span>
  );
}
