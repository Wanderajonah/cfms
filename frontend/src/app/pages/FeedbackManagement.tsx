import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Search, Filter, Download, Star } from 'lucide-react';
import { api, Feedback } from '../lib/api';

export function FeedbackManagement() {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    type: 'all' as 'all' | 'complaint' | 'suggestion' | 'compliment',
    search: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    if (!status && !type) return;
    setFilters((prev) => {
      const next = { ...prev };
      if (status && ['all', 'pending', 'in-progress', 'resolved', 'escalated'].includes(status)) {
        next.status = status;
      }
      if (type && ['all', 'complaint', 'suggestion', 'compliment'].includes(type)) {
        next.type = type as 'all' | 'complaint' | 'suggestion' | 'compliment';
      }
      return next;
    });
    setPage(1);
  }, [searchParams]);

  const [data, setData] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.feedback.list({
          page,
          limit: 20,
          status: filters.status,
          category: filters.category,
          type: filters.type,
          search: filters.search,
          sort: '-createdAt',
        });
        if (cancelled) return;
        setData(res.items);
        setTotal(res.total);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Failed to load feedback');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters.category, filters.search, filters.status, filters.type, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / 20)), [total]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
          <p className="text-gray-600 mt-1">Review and manage all customer feedback</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    setPage(1);
                    setFilters({ ...filters, search: e.target.value });
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  placeholder="Search feedback..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setPage(1);
                  setFilters({ ...filters, status: e.target.value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setPage(1);
                  setFilters({
                    ...filters,
                    type: e.target.value as 'all' | 'complaint' | 'suggestion' | 'compliment',
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">All types</option>
                <option value="complaint">Complaint</option>
                <option value="suggestion">Suggestion</option>
                <option value="compliment">Compliment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => {
                  setPage(1);
                  setFilters({ ...filters, category: e.target.value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">All Categories</option>
                <option value="Food Quality">Food Quality</option>
                <option value="Service">Service</option>
                <option value="Ambiance">Ambiance</option>
                <option value="Pricing">Pricing</option>
                <option value="Menu">Menu</option>
              </select>
            </div>

            <div className="flex items-end">
              <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium w-full justify-center">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">ID</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Category</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Type</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Rating</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Message</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-gray-700">Assignee</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td className="py-8 px-6 text-sm text-gray-600" colSpan={10}>
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td className="py-8 px-6 text-sm text-gray-600" colSpan={10}>
                      No feedback found.
                    </td>
                  </tr>
                ) : (
                  data.map((feedback, index) => (
                  <tr key={feedback._id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900">
                        #{feedback.ticketNumber ?? feedback._id.slice(-6)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{feedback.name || 'Anonymous'}</p>
                        {feedback.email ? <p className="text-xs text-gray-600">{feedback.email}</p> : null}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">{feedback.category}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm capitalize text-gray-700">{feedback.type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (feedback.rating || 0) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600 truncate max-w-xs">{feedback.message}</p>
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={feedback.status as any}>
                        {feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1).replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{new Date(feedback.createdAt).toISOString().slice(0, 10)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{feedback.assignedTo || '-'}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        to={`/admin/feedback/${feedback._id}`}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {data.length} of {total} feedback items
            </p>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>
              <button className="px-3 py-1 bg-orange-600 text-white rounded text-sm">{page}</button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </Card>
    </div>
  );
}
