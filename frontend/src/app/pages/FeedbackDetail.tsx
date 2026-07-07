import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { ArrowLeft, Star, Mail, Phone, User, Calendar, AlertCircle, Send, CheckCircle } from 'lucide-react';
import { api, Feedback } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { User as StaffUser } from '../lib/api';

export function FeedbackDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const backPath = user?.role === 'staff' ? '/staff' : '/admin/feedback';
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'in-progress' | 'resolved' | 'escalated'>('pending');
  const [assignee, setAssignee] = useState('');
  const [contacts, setContacts] = useState<Array<{ _id: string; name: string; phone: string }>>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [customNumber, setCustomNumber] = useState<string>('');
  const [sendSms, setSendSms] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        const f = await api.feedback.get(id);
        if (cancelled) return;
        setFeedback(f);
        setNewStatus(f.status);
        setAssignee(f.assignedTo || '');
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load feedback');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.contacts.list();
        if (!cancelled) setContacts(res.items as any);
      } catch {
        if (!cancelled) setContacts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStaffLoading(true);
        const res = await api.auth.listUsers({ role: 'staff' });
        if (!cancelled) setStaffMembers(res.items);
      } catch {
        if (!cancelled) setStaffMembers([]);
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRespond = async () => {
    if (!id) return;
    try {
      const toNumber = customNumber.trim() ? customNumber.trim() : undefined;
      const res = await api.feedback.respond(id, {
        response,
        sendSms,
        toNumber,
        contactId: selectedContactId || undefined,
      });
      setFeedback(res.feedback);
      setResponse('');
      if (sendSms) {
        if (res.smsError) {
          alert(`Response saved, but SMS failed: ${res.smsError}`);
        } else {
          alert('Response saved and SMS sent!');
        }
      } else {
        alert('Response saved successfully!');
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to send response');
    }
  };

  const handleEscalate = async () => {
    if (!id) return;
    try {
      const updated = await api.feedback.escalate(id);
      setFeedback(updated);
      setNewStatus(updated.status);
      alert('Feedback escalated to management');
    } catch (err: any) {
      alert(err?.message || 'Failed to escalate');
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    try {
      const updated = await api.feedback.resolve(id);
      setFeedback(updated);
      setNewStatus(updated.status);
      alert('Feedback marked as resolved');
    } catch (err: any) {
      alert(err?.message || 'Failed to resolve');
    }
  };

  const handleAssign = async () => {
    if (!id) return;
    try {
      const updated = await api.feedback.assign(id, assignee);
      setFeedback(updated);
      setNewStatus(updated.status);
      alert('Assigned successfully');
    } catch (err: any) {
      alert(err?.message || 'Failed to assign');
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <div className="mb-6">
          <Link
            to={backPath}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Feedback List</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Feedback #{feedback?.ticketNumber ?? id?.slice(-6)}
              </h1>
              <p className="text-gray-600 mt-1">
                {isLoading || !feedback ? 'Loading...' : `Submitted on ${new Date(feedback.createdAt).toLocaleString()}`}
              </p>
            </div>
            <Badge status={newStatus as any}>
              {newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {!isLoading && feedback && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Feedback Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900 mt-1">{feedback.category}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-gray-900 mt-1 capitalize">{feedback.type}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Rating</label>
                  <div className="flex items-center space-x-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < (feedback.rating || 0) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <p className="text-gray-900 mt-1 leading-relaxed">{feedback.message}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="bg-orange-100 rounded-full p-2">
                      <CheckCircle className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Feedback submitted</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(feedback.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {feedback.respondedAt && (
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="bg-orange-100 rounded-full p-2">
                        <CheckCircle className="w-4 h-4 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Response sent</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(feedback.respondedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {feedback.resolvedAt && (
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="bg-orange-100 rounded-full p-2">
                        <CheckCircle className="w-4 h-4 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Marked as resolved</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(feedback.resolvedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Response</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Send as SMS</label>
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                </div>

                {sendSms && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pick contact (optional)</label>
                      <select
                        value={selectedContactId}
                        onChange={(e) => setSelectedContactId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      >
                        <option value="">Use feedback phone (if available)</option>
                        {contacts.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name} ({c.phone})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        If you select a contact, SMS will go to that contact’s phone.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Or enter phone number (optional)</label>
                      <input
                        value={customNumber}
                        onChange={(e) => setCustomNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        placeholder='256700111222'
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Use international format, e.g. <span className="font-mono">256700111222</span>. If filled, this overrides contact/feedback phone.
                      </p>
                    </div>
                  </div>
                )}

                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Type your response to the customer..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleRespond}
                    disabled={!response}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sendSms ? 'Send SMS Response' : 'Save Response'}</span>
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Save Draft
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Info</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="text-gray-900">{feedback.name || 'Anonymous'}</p>
                  </div>
                </div>
                {feedback.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <a href={`mailto:${feedback.email}`} className="text-orange-600 hover:text-orange-700">
                        {feedback.email}
                      </a>
                    </div>
                  </div>
                )}
                {feedback.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <a href={`tel:${feedback.phone}`} className="text-orange-600 hover:text-orange-700">
                        {feedback.phone}
                      </a>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-gray-900">{new Date(feedback.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>

            {user?.role === 'admin' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Staff
                  </label>
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select staff member</option>
                    {staffLoading && (
                      <option value="" disabled>
                        Loading staff...
                      </option>
                    )}
                    {!staffLoading && staffMembers.length === 0 && (
                      <option value="" disabled>
                        No staff found
                      </option>
                    )}
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.email}>
                        {staff.name ? `${staff.name} (${staff.email})` : staff.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAssign}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Assign
                </button>
              </div>
            </Card>
            )}

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={handleResolve}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Resolved</span>
                </button>
                <button
                  onClick={handleEscalate}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Escalate to Manager</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
        )}
    </div>
  );
}
