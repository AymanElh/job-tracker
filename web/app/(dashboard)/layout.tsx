'use client';

import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-20 md:pb-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
