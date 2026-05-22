import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'staff'
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(formData.email, formData.password);
      navigate(user.role === 'admin' ? '/admin' : '/staff');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2ef] px-4 py-10">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-[#e5d8cf] bg-white shadow-[0_20px_45px_-30px_rgba(0,0,0,0.35)]">
        <div className="bg-gradient-to-r from-[#3a1f14] via-[#4a2516] to-[#2a140d] px-6 pb-6 pt-5 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/80 text-[10px] font-bold text-white">
              CJ
            </span>
            Cafe Javas
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-white/70">Sign in to your feedback management portal</p>
          <div className="mt-4 h-0.5 w-12 rounded-full bg-orange-400" />
        </div>

        <div className="bg-[#fcfaf8] px-6 pb-7 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Role
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#e6d9cf] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    formData.role === 'admin'
                      ? 'bg-[#f3e6dc] text-[#3a1f14] shadow-sm'
                      : 'text-gray-600 hover:bg-orange-50/70'
                  }`}
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'staff' })}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    formData.role === 'staff'
                      ? 'bg-[#f3e6dc] text-[#3a1f14] shadow-sm'
                      : 'text-gray-600 hover:bg-orange-50/70'
                  }`}
                >
                  Staff
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Email Address
              </label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-[#e6d9cf] bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="you@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-xl border border-[#e6d9cf] bg-white py-2.5 pl-9 pr-10 text-sm text-gray-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400"
                  aria-label="Toggle password visibility"
                >
                  👁
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                Remember me
              </label>
              <a href="#" className="font-medium text-orange-600 hover:text-orange-700">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#eadbd1] bg-white px-6 py-3 text-sm font-semibold text-[#3a1f14] shadow-sm transition hover:border-orange-300"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 border-t border-[#efe5dd] pt-4 text-center text-[11px] uppercase tracking-[0.15em] text-gray-400">
            Protected by end-to-end encryption
          </div>
        </div>
      </div>
    </div>
  );
}
