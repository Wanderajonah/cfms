import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card } from '../components/Card';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { ArrowLeft, User } from 'lucide-react';

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.toString() || 'http://localhost:5000';

function previewUrl(avatarUrl?: string | null) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  return `${API_BASE}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const base = user?.role === 'admin' ? '/admin' : '/staff';
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(previewUrl(user?.avatarUrl ?? null));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setName(user?.name || '');
    setPreview(previewUrl(user?.avatarUrl ?? null));
  }, [user?.name, user?.avatarUrl]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword && !currentPassword.trim()) {
      setMessage({ type: 'err', text: 'Enter your current password to set a new password.' });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'err', text: 'New password must be at least 6 characters.' });
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      if (file) fd.append('avatar', file);
      if (newPassword) {
        fd.append('currentPassword', currentPassword);
        fd.append('newPassword', newPassword);
      }
      const res = await api.auth.patchProfile(fd);
      await refreshUser();
      setFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setPreview(previewUrl(res.user.avatarUrl));
      setMessage({ type: 'ok', text: 'Profile updated.' });
    } catch (err: any) {
      setMessage({ type: 'err', text: err?.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to={base}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
        <p className="mt-1 text-sm text-slate-600">Update your name, photo, or password.</p>
      </div>

      <Card className="p-6">
        {message && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              message.type === 'ok'
                ? 'border-green-200 bg-green-50 text-green-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-2 ring-slate-100">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-500">
                  <User className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="w-full flex-1 space-y-2">
              <label className="block text-sm font-medium text-slate-700">Profile photo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-orange-700"
              />
              <p className="text-xs text-slate-500">JPEG, PNG, GIF or Webp. Max 2 MB.</p>
            </div>
          </div>

          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700">
              Display name
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25"
              placeholder="Your name"
            />
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-sm font-semibold text-slate-900">Change password (optional)</h2>
            <p className="mt-1 text-xs text-slate-500">Leave blank to keep your current password.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="cur-pw" className="block text-sm font-medium text-slate-700">
                  Current password
                </label>
                <input
                  id="cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25"
                />
              </div>
              <div>
                <label htmlFor="new-pw" className="block text-sm font-medium text-slate-700">
                  New password
                </label>
                <input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/25"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50 sm:w-auto"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </Card>
    </div>
  );
}
