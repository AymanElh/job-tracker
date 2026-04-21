'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { token, data } = response.data;
      setAuth(data.user, token);
      toast.success('Account created successfully!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-sm space-y-12">
        <header className="space-y-4">
          <h1 className="text-6xl font-heading font-black tracking-tighter text-foreground">
            JOIN<span className="text-primary">US</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">
            Start tracking your professional growth today.
          </p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-muted/20 border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted/20 border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Password</label>
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
              "CREATE ACCOUNT"
            )}
          </Button>
          
          <p className="text-center text-xs font-medium text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
      
      <footer className="mt-20 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/30">
        JobTrackr Pro © 2026 / Secure Onboarding
      </footer>
    </div>
  );
}
