'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch<{ access_token: string; user?: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Save token to cookie and localStorage for auth guards
      document.cookie = `token=${data.access_token}; path=/; max-age=86400; SameSite=Strict`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', data.access_token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      router.push('/');
      router.refresh();
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch') || err.message?.includes('fetch failed')) {
        setError('Unable to connect to API server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border shadow-sm p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to Xiphos</h1>
          <p className="text-sm text-gray-500 mt-2">Enter your admin credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-black text-white rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
