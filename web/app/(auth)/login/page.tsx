'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      setAuth(user, token);
      toast.success('Welcome back!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-sm space-y-12">
        <header className="space-y-4">
          <h1 className="text-6xl font-heading font-black tracking-tighter text-foreground">
            SIGN<span className="text-primary">IN</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">
            Continue tracking your career journey.
          </p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted/20 border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Password</label>
                <Link href="#" className="text-[10px] font-bold text-primary hover:underline">Forgot?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted/20 border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold tracking-tight rounded-none transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "SIGN IN TO DASHBOARD"
            )}
          </Button>
          
          <p className="text-center text-xs font-medium text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-bold">
              Join now
            </Link>
          </p>
        </form>
      </div>
      
      <footer className="mt-20 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">
        JobTrackr Pro © 2026 / Version 1.2
      </footer>
    </div>
  );
}
