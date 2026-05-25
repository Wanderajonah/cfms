import { useEffect, useState } from 'react';
import { StatCard } from '../components/StatCard';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { MessageSquare, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, ComposedChart, Line, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router';
import { api, Feedback, FeedbackSummary } from '../lib/api';

const COLORS = ['#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export function AdminDashboard() {
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.feedback.list({ limit: 4, page: 1, sort: '-createdAt' });
  const summaryRes = await api.feedback.summary({ startDate: '2026-05-20' });
        if (!cancelled) {
          setRecentFeedback(res.items);
          setSummary(summaryRes);
        }
      } catch {
        // keep UI working even if backend is down
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestDay = summary?.daily?.[summary.daily.length - 1];
  const prevDay = summary?.daily?.[summary.daily.length - 2];
  const totalDelta = latestDay && prevDay ? latestDay.total - prevDay.total : null;
  const resolvedDelta = latestDay && prevDay ? latestDay.resolved - prevDay.resolved : null;
  const totalTrend = totalDelta === null
    ? 'Updated today'
    : `${Math.abs(totalDelta)} ${totalDelta >= 0 ? 'more' : 'fewer'} than yesterday`;
  const resolvedTrend = resolvedDelta === null
    ? 'Resolution activity'
    : `${Math.abs(resolvedDelta)} ${resolvedDelta >= 0 ? 'more' : 'fewer'} than yesterday`;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Monitor and manage customer feedback</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Feedback"
            value={summary ? String(summary.totals.total) : '—'}
            icon={MessageSquare}
            trend={totalTrend}
            trendUp={totalDelta === null ? true : totalDelta >= 0}
          />
          <StatCard
            title="Pending Review"
            value={summary ? String(summary.totals.pending) : '—'}
            icon={Clock}
            trend="Pending items"
            trendUp={false}
          />
          <StatCard
            title="Resolved"
            value={summary ? String(summary.totals.resolved) : '—'}
            icon={CheckCircle}
            trend={resolvedTrend}
            trendUp={resolvedDelta === null ? true : resolvedDelta >= 0}
          />
          <StatCard
            title="Avg Response Time"
            value={summary?.avgResponseHours ? `${summary.avgResponseHours}h` : '—'}
            icon={TrendingUp}
            trend="Avg response duration"
            trendUp={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={summary?.daily ?? []} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                  interval={(() => {
                    const len = (summary?.daily?.length || 0);
                    if (len <= 6) return 0;
                    return Math.max(1, Math.floor(len / 6));
                  })()}
                />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip
                  formatter={(value: any, name: string) => [value, name === 'total' ? 'Total feedback' : 'Resolved']}
                  labelFormatter={(label: any) => `Date: ${label}`}
                />
                <Legend verticalAlign="bottom" height={36} />

                <Area type="monotone" dataKey="total" fill="#ffedd5" stroke="transparent" fillOpacity={0.6} />

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#ea580c"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                  name="Total Feedback"
                  isAnimationActive={true}
                  animationDuration={600}
                />

                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  name="Resolved"
                  isAnimationActive={true}
                  animationDuration={600}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={summary?.categories ?? []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(summary?.categories ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
            <Link
              to="/admin/feedback"
              className="flex items-center space-x-1 text-sm text-orange-600 hover:text-orange-700"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Message</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentFeedback.map((feedback) => (
                  <tr key={feedback._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{feedback.name || 'Anonymous'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600 text-sm truncate max-w-xs block">
                        {feedback.message}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge status={feedback.status as any}>
                        {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">{new Date(feedback.createdAt).toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/admin/feedback/${feedback._id}`}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
    </div>
  );
}
