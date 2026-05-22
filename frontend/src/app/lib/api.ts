const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.toString() ||
  'http://localhost:5000';

export type ApiError = { message: string; status?: number };

function getToken() {
  return localStorage.getItem('cfms_token');
}

async function requestForm<T>(path: string, form: FormData): Promise<T> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH', body: form, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message = (body && (body.message || body.error)) || res.statusText || 'Request failed';
    throw { message, status: res.status } satisfies ApiError;
  }
  return body as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message = (body && (body.message || body.error)) || res.statusText || 'Request failed';
    throw { message, status: res.status } satisfies ApiError;
  }
  return body as T;
}

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  name?: string | null;
  avatarUrl?: string | null;
};

export type Feedback = {
  _id: string;
  ticketNumber?: number;
  name?: string;
  email?: string;
  phone?: string;
  category: string;
  type: 'complaint' | 'suggestion' | 'compliment';
  rating?: number;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'escalated';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string | null;
  response?: string | null;
  staffNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  respondedAt?: string | null;
  automatedSmsAt?: string | null;
  automatedSmsBody?: string | null;
  automatedSmsError?: string | null;
  automatedSmsSkipped?: 'disabled' | 'no_phone' | 'invalid_phone' | 'no_groq' | 'complaint_policy';
};

export type FeedbackSummary = {
  totals: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    escalated: number;
  };
  categories: Array<{ name: string; value: number }>;
  monthly: Array<{ month: string; total: number; resolved: number }>;
  daily: Array<{ date: string; total: number; resolved: number }>;
  avgResponseHours: number | null;
};

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ user: User }>('/api/auth/me'),
    register: (payload: { email: string; password: string; name?: string; role?: 'admin' | 'staff' }) =>
      request<{ token?: string; user?: User; id?: string; role?: string; email?: string }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify(payload) }
      ),
    patchProfile: (form: FormData) => requestForm<{ user: User }>('/api/auth/profile', form),
    listUsers: (params: { role?: 'admin' | 'staff' } = {}) => {
      const qs = new URLSearchParams();
      if (params.role) qs.set('role', params.role);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ items: User[] }>(`/api/auth/users${suffix}`);
    },
  },
  feedback: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === '' || v === 'all') continue;
        qs.set(k, String(v));
      }
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return request<{ items: Feedback[]; total: number; page: number; limit: number; totalPages: number }>(
        `/api/feedback${suffix}`
      );
    },
    get: (id: string) => request<Feedback>(`/api/feedback/${id}`),
    create: (payload: Partial<Feedback>) =>
      request<Feedback>('/api/feedback', { method: 'POST', body: JSON.stringify(payload) }),
    assign: (id: string, assignedTo: string) =>
      request<Feedback>(`/api/feedback/${id}/assign`, { method: 'POST', body: JSON.stringify({ assignedTo }) }),
    respond: (
      id: string,
      payload: { response: string; sendSms?: boolean; toNumber?: string; contactId?: string }
    ) =>
      request<{ feedback: Feedback; smsResult?: any }>(`/api/feedback/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    resolve: (id: string, staffNotes?: string) =>
      request<Feedback>(`/api/feedback/${id}/resolve`, { method: 'POST', body: JSON.stringify({ staffNotes }) }),
    escalate: (id: string) =>
      request<Feedback>(`/api/feedback/${id}/escalate`, { method: 'POST' }),
    summary: () => request<FeedbackSummary>('/api/feedback/summary'),
  },
  contacts: {
    list: (search?: string) => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return request<{ items: Array<{ _id: string; name: string; phone: string; email?: string }> }>(`/api/contacts${qs}`);
    },
    create: (payload: { name: string; phone: string; email?: string; notes?: string }) =>
      request(`/api/contacts`, { method: 'POST', body: JSON.stringify(payload) }),
  },
  notifications: {
    adminSummary: () => request<{ pendingComplaints: number }>('/api/notifications/admin'),
  },
};

