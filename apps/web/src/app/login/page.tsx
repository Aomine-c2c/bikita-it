'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getSavedApiBaseUrl, saveApiBaseUrl } from '@/lib/api';
import { Server, Settings2, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@bikitaminerals.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Server Configuration State
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    setServerUrl(getSavedApiBaseUrl());
  }, []);

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
        setError('Unable to connect to API server. Please ensure the backend is running or configure the server IP.');
      } else {
        setError(err.message || 'Login failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@bikitaminerals.com');
    setPassword('password123');
  };

  const handleTestConnection = async () => {
    if (!serverUrl) return;
    setTestStatus('testing');
    setTestMessage('Pinging server...');

    let cleanUrl = serverUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl = `${cleanUrl}/api`;
    }

    try {
      const res = await fetch(`${cleanUrl}/health`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMessage(`Connected successfully (${data.service || 'Pulse API'} ${data.version || ''})`);
      } else {
        setTestStatus('error');
        setTestMessage(`Server responded with status ${res.status}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(
        'Connection refused. Ensure backend is running with "python manage.py runserver 0.0.0.0:3001" and firewall allows port 3001.'
      );
    }
  };

  const handleSaveServerConfig = () => {
    saveApiBaseUrl(serverUrl);
    setShowServerConfig(false);
    setError('');
  };

  return (
    <main className="min-h-screen grid place-items-center bg-mesh p-4 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>
      <div className="absolute -bottom-32 left-20 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply blur-3xl opacity-70"></div>

      <div className="w-full max-w-md glass rounded-2xl shadow-premium p-8 relative z-10 transition-all duration-500 hover:shadow-premium-hover">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground text-gradient">Sign in to Pulse</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Enterprise IT Operations Platform</p>
        </div>

        {/* Server Indicator & Config Button */}
        <div className="mb-4 flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/5 dark:bg-slate-900/40 border border-border/60 text-xs">
          <div className="flex items-center gap-2 truncate max-w-[260px]">
            <Server className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground truncate font-mono text-[11px]">
              {serverUrl || 'http://127.0.0.1:3001/api'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Change</span>
          </button>
        </div>

        {/* Server Connection Modal / Expandable Panel */}
        {showServerConfig && (
          <div className="mb-5 p-4 rounded-xl bg-background border border-primary/30 shadow-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-primary" />
                Backend Server Address
              </h4>
              <span className="text-[10px] text-muted-foreground">LAN / Cloud Host</span>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="http://192.168.1.100:3001/api"
                className="w-full px-3 py-2 text-xs font-mono bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                If running on another device, enter host machine IP (e.g. <span className="font-mono">http://192.168.x.x:3001/api</span>).
              </p>
            </div>

            {testStatus !== 'idle' && (
              <div
                className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                  testStatus === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : testStatus === 'error'
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}
              >
                {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
                {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                {testStatus === 'error' && <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                <span className="text-[11px] leading-tight">{testMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="flex-1 py-1.5 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                type="button"
                onClick={handleSaveServerConfig}
                className="flex-1 py-1.5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Save & Connect
              </button>
            </div>
          </div>
        )}

        {/* Quick Credentials Info Badge */}
        <div className="mb-5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center justify-between">
          <div>
            <p className="font-bold text-primary">Default Admin Credentials</p>
            <p className="font-mono text-[11px] text-muted-foreground mt-0.5">admin@bikitaminerals.com • password123</p>
          </div>
          <button
            type="button"
            onClick={handleQuickFill}
            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition-colors cursor-pointer"
          >
            Fill
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center backdrop-blur-sm space-y-2">
              <p>{error}</p>
              {error.includes('Unable to connect') && !showServerConfig && (
                <button
                  type="button"
                  onClick={() => setShowServerConfig(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary underline hover:text-primary/80 cursor-pointer"
                >
                  Configure Server Address <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-foreground/90" htmlFor="email">
              Work Email or Username
            </label>
            <input
              id="email"
              type="text"
              required
              className="w-full px-4 py-2.5 bg-background/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bikitaminerals.com"
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
            className="w-full py-3 px-4 mt-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-5 text-center">
          <a href="/welcome" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            ← View System Introduction
          </a>
        </div>
      </div>
    </main>
  );
}
