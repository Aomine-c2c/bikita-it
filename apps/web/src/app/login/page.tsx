 
 

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
        body: JSON.stringify({ username: email, password }),
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
    <main className="min-h-screen grid place-items-center bg-mesh p-4 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>

      <div className="w-full max-w-md glass rounded-2xl shadow-premium p-8 relative z-10 transition-all duration-500 hover:shadow-premium-hover">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground text-gradient">Sign in to Pulse</h1>
          <p className="text-sm text-muted-foreground mt-3 font-medium">Enterprise IT Operations Platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center backdrop-blur-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground/90" htmlFor="email">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-4 py-2.5 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground/90" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full px-4 py-2.5 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
