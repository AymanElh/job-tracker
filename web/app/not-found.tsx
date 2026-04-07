'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background selection:bg-primary selection:text-primary-foreground">
      <div className="max-w-xl w-full text-center space-y-12">
        {/* Large 404 Display */}
        <div className="relative inline-block group">
          <div className="absolute -inset-4 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
          <h1 className="relative text-[160px] font-heading font-black tracking-tighter leading-none select-none">
            4<span className="text-primary italic inline-block transform -skew-x-12">0</span>4
          </h1>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-heading font-black uppercase tracking-tighter">
              PAGE <span className="text-primary">MISSING</span> IN ACTION
            </h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              <span>THE RESOURCE YOU ARE LOOKING FOR DOES NOT EXIST</span>
              <AlertTriangle className="w-3 h-3 text-destructive" />
            </div>
          </div>

          <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-md mx-auto">
            You&apos;ve reached a dead end in the tracking pipeline. This page might have been moved, deleted, or never existed in the workspace.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/applications" className="w-full sm:w-auto">
            <Button 
              className="w-full sm:w-auto h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold tracking-tight rounded-none shadow-2xl shadow-primary/20 transition-all active:scale-95"
            >
              <Home className="w-4 h-4 mr-2" /> BACK TO WORKSPACE
            </Button>
          </Link>
          
          <Link href="/applications" className="w-full sm:w-auto">
            <Button 
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 border-border bg-card/30 hover:bg-muted font-heading font-bold tracking-tight rounded-none transition-all active:scale-95"
            >
              <Search className="w-4 h-4 mr-2 text-primary" /> SEARCH APPLICATIONS
            </Button>
          </Link>
        </div>

        {/* Branding Footer */}
        <div className="pt-20">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground/30">
            APPLICATIONS<span className="text-primary/30">WORKSPACE</span> — SYSTEM ERR 404
          </p>
        </div>
      </div>
    </div>
  );
}
