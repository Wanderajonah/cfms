import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Lock, Mail, ArrowRight, UtensilsCrossed, Star, MessageSquare, TrendingUp } from 'lucide-react';
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
    <div className="flex min-h-screen">
      {/* Left column - Branding (40%) */}
      <div className="hidden flex-col justify-between bg-gradient-to-br from-[#3a1f14] via-[#4a2516] to-[#2a140d] p-12 text-white lg:flex lg:w-[40%]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/80">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight">Cafe Javas</p>
            <p className="text-xs text-orange-200/70">Kampala, Uganda</p>
          </div>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-8">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=350&fit=crop&auto=format"
              alt="Delicious restaurant food"
              className="h-48 w-80 rounded-2xl object-cover opacity-90 shadow-2xl"
            />
            <div className="absolute -bottom-3 -right-3 rounded-xl bg-white p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                <span className="text-xs font-semibold text-gray-800">4.8 Rating</span>
              </div>
            </div>
            <div className="absolute -left-3 -top-3 rounded-xl bg-white p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-orange-600" />
                <span className="text-xs font-semibold text-gray-800">2.4K Reviews</span>
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold">Customer Feedback</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-orange-200/80">
            Management Dashboard — Collect, track, and respond to customer feedback to deliver exceptional dining experiences.
          </p>
          <div className="mt-8 flex items-center gap-8">
            {[
              { v: "2", l: "Roles" },
              { v: "3", l: "Modules" },
              { v: "98%", l: "Uptime" }
            ].map(({ v, l }) => (
              <div key={l} className="text-center">
                <p className="text-2xl font-bold text-orange-400">{v}</p>
                <p className="text-xs text-orange-200/60">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-orange-200/50">Cafe Javas · Kampala, Uganda</p>
        </div>
      </div>

      {/* Right column - Login form (60%) */}
      <div className="flex w-full items-center justify-center bg-[#faf8f6] px-6 lg:w-[60%]">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-[#3a1f14] to-[#2a140d]">
              <UtensilsCrossed className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#3a1f14]">Cafe Javas</h1>
            <p className="mt-1 text-sm text-stone-600">Customer Feedback Management Dashboard</p>
          </div>

          <div className="rounded-2xl border border-[#e5d8cf] bg-white p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.15)]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#3a1f14]">Welcome back</h1>
              <p className="mt-1 text-sm text-stone-500">Sign in to your feedback management portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
                  Role
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg border border-[#e5d8cf] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`rounded-md py-2 text-sm font-medium transition-all ${
                      formData.role === 'admin'
                        ? 'bg-gradient-to-r from-[#3a1f14] to-[#2a140d] text-white shadow-sm'
                        : 'text-stone-600 hover:bg-orange-50'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'staff' })}
                    className={`rounded-md py-2 text-sm font-medium transition-all ${
                      formData.role === 'staff'
                        ? 'bg-gradient-to-r from-[#3a1f14] to-[#2a140d] text-white shadow-sm'
                        : 'text-stone-600 hover:bg-orange-50'
                    }`}
                  >
                    Staff
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-[#e5d8cf] bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 placeholder-stone-400 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="you@cafejavas.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-stone-500">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-[#e5d8cf] bg-white py-2.5 pl-10 pr-10 text-sm text-stone-800 placeholder-stone-400 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400"
                    aria-label="Toggle password visibility"
                  >
                    {'\uD83D\uDC41'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-stone-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500"
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#3a1f14] to-[#2a140d] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 border-t border-[#efe5dd] pt-4 text-center text-xs uppercase tracking-[0.15em] text-stone-400">
              <div className="flex items-center justify-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                Protected by end-to-end encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
