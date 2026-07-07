import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import { CheckCircle, Clock, AlertCircle, Star, MessageSquare, ArrowUpCircle } from 'lucide-react';
import { api, Feedback } from '../lib/api';
import { useAuth } from '../lib/auth';

export function StaffPanel() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'active' | 'resolved'>('active');
  const [actionNote, setActionNote] = useState<{ [key: string]: string }>({});
  const [assignments, setAssignments] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await api.feedback.list({ assignedTo: user?.email || '', limit: 100, page: 1, sort: '-createdAt' });
        if (!cancelled) setAssignments(res.items);
      } catch {
        if (!cancelled) setAssignments([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const activeAssignments = assignments.filter(a => a.status !== 'resolved');
  const resolvedAssignments = assignments.filter(a => a.status === 'resolved');

  const displayAssignments = selectedTab === 'active' ? activeAssignments : resolvedAssignments;

  const handleResolve = async (id: string) => {
    try {
      await api.feedback.resolve(id, actionNote[id]);
      const res = await api.feedback.list({ assignedTo: user?.email || '', limit: 100, page: 1, sort: '-createdAt' });
      setAssignments(res.items);
      alert(`Feedback marked as resolved!`);
    } catch (err: any) {
      alert(err?.message || 'Failed to resolve');
    }
  };

  const handleAddNote = async (id: string) => {
    alert(`Note saved locally (sent on resolve).`);
  };

  const handleEscalate = async (id: string) => {
    try {
      await api.feedback.escalate(id);
      const res = await api.feedback.list({ assignedTo: user?.email || '', limit: 100, page: 1, sort: '-createdAt' });
      setAssignments(res.items);
      alert('Feedback escalated to management');
    } catch (err: any) {
      alert(err?.message || 'Failed to escalate');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
          <p className="text-gray-600 mt-1">Manage your assigned feedback items</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Assignments"
            value={activeAssignments.length}
            icon={MessageSquare}
          />
          <StatCard
            title="Resolved This Week"
            value="12"
            icon={CheckCircle}
          />
          <StatCard
            title="Avg Resolution Time"
            value="5.2h"
            icon={Clock}
          />
        </div>

        <Card className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setSelectedTab('active')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'active'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Active ({activeAssignments.length})
              </button>
              <button
                onClick={() => setSelectedTab('resolved')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === 'resolved'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Resolved ({resolvedAssignments.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {displayAssignments.map((assignment) => (
                <Card key={assignment._id} className="p-6 border-l-4" style={{
                  borderLeftColor: assignment.priority === 'high' ? '#ef4444' : assignment.priority === 'medium' ? '#f59e0b' : '#10b981'
                }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Feedback #{assignment.ticketNumber ?? assignment._id.slice(-6)} - {assignment.name || 'Anonymous'}
                        </h3>
                        <Badge status={assignment.status as any}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).replace('-', ' ')}
                        </Badge>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          assignment.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : assignment.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {assignment.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center space-x-1">
                          <span className="font-medium">Category:</span>
                          <span>{assignment.category}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-orange-500" />
                          <span>{assignment.rating || 0}/5</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Created: {new Date(assignment.createdAt).toISOString().slice(0, 10)}</span>
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{assignment.message}</p>

                      {selectedTab === 'active' && (
                        <div className="space-y-3 pt-4 border-t border-gray-200">
                          <textarea
                            value={actionNote[assignment._id] || ''}
                            onChange={(e) => setActionNote({ ...actionNote, [assignment._id]: e.target.value })}
                            rows={2}
                            placeholder="Add resolution notes or actions taken..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleResolve(assignment._id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Mark as Resolved</span>
                            </button>
                            <button
                              onClick={() => handleEscalate(assignment._id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                              <span>Escalate</span>
                            </button>
                            <button
                              onClick={() => handleAddNote(assignment._id)}
                              disabled={!actionNote[assignment._id]}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              Add Note
                            </button>
                            <Link
                              to={`/staff/feedback/${assignment._id}`}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      )}

                      {selectedTab === 'resolved' && assignment.resolvedAt && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>Resolved on {new Date(assignment.resolvedAt).toISOString().slice(0, 10)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {(isLoading || displayAssignments.length === 0) && (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">
                    {isLoading
                      ? 'Loading assignments...'
                      : selectedTab === 'active'
                      ? 'No active assignments at the moment'
                      : 'No resolved feedback yet'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
    </div>
  );
}
