'use client';

import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ArrowRight,
  ExternalLink,
  MapPin,
  Loader2
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import NewApplicationSheet from "@/components/applications/NewApplicationSheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  screening: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  technical: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  interview: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  offer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  withdrawn: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['applications-stats'],
    queryFn: async () => {
      const response = await api.get('/applications/stats');
      return response.data.data || [];
    },
  });

  const { data: recentAppsData, isLoading: isAppsLoading } = useQuery({
    queryKey: ['applications', 'recent'],
    queryFn: async () => {
      const response = await api.get('/applications?limit=5&sort=-createdAt');
      return response.data.data || [];
    },
  });

  const calculateStats = () => {
    if (!statsData) return { total: 0, interviews: 0, offers: 0 };
    
    let total = 0;
    let interviews = 0;
    let offers = 0;

    statsData.forEach((stat: any) => {
      total += stat.count;
      if (stat.status === 'technical' || stat.status === 'interview') {
        interviews += stat.count;
      }
      if (stat.status === 'offer') {
        offers += stat.count;
      }
    });

    return { total, interviews, offers };
  };

  const { total, interviews, offers } = calculateStats();

  const stats = [
    { label: 'Total Jobs', value: total.toString().padStart(2, '0'), color: 'text-emerald-500', icon: Briefcase, detail: 'Pipeline' },
    { label: 'Interviews', value: interviews.toString().padStart(2, '0'), color: 'text-blue-500', icon: Clock, detail: 'In progress' },
    { label: 'Offers', value: offers.toString().padStart(2, '0'), color: 'text-primary', icon: CheckCircle2, detail: 'Received' },
    { label: 'Action Required', value: '00', color: 'text-red-500', icon: AlertCircle, detail: 'Follow-ups due' },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em] mb-2">Workspace Overview</p>
          <h1 className="text-5xl font-heading font-extrabold tracking-tighter">
            WELCOME BACK, <span className="text-primary">{user?.name?.split(' ')[0] || 'USER'}</span>
          </h1>
        </div>
        
        <NewApplicationSheet />
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-6 border border-border bg-card/50 hover:border-primary/50 transition-colors group">
            <div className="flex justify-between items-start mb-6">
              <stat.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.detail}</span>
            </div>
            <p className="text-4xl font-heading font-black mb-1">
              {isStatsLoading ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : stat.value}
            </p>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-heading font-bold uppercase tracking-tight">Recent Applications</h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search jobs..." 
                className="pl-10 pr-4 py-2 bg-muted/30 border border-border text-xs font-medium focus:border-primary outline-none w-64 transition-all"
              />
            </div>
          </div>
          
          {isAppsLoading ? (
            <div className="border border-border p-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : recentAppsData?.length === 0 ? (
            <div className="border border-border p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Briefcase className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg mb-1">No applications found</p>
                <p className="text-muted-foreground text-sm max-w-sm">Ready to level up? Start tracking your applications to see them appear here.</p>
              </div>
              <Link href="/applications" className="inline-flex items-center justify-center h-8 px-4 mt-4 border border-border bg-background hover:bg-muted font-bold text-xs uppercase tracking-widest rounded-lg transition-colors">
                View all applications <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </div>
          ) : (
            <div className="border border-border bg-card/30 divide-y divide-border">
              {recentAppsData?.map((app: Record<string, any>) => (
                <div key={app._id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{app.company?.name || 'Unknown Company'}</p>
                      <p className="text-xs text-muted-foreground font-medium">{app.jobTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <MapPin className="w-3 h-3" />
                      {app.location?.city || 'Remote'}
                    </div>
                    <Badge variant="outline" className={`${statusColors[app.status]} rounded-none px-2 py-0 text-[10px] uppercase font-bold tracking-tight`}>
                      {app.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground font-medium w-24 text-right">
                      {format(new Date(app.appliedAt || app.createdAt), 'MMM dd, yyyy')}
                    </div>
                    {app.jobUrl && (
                      <a 
                        href={app.jobUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              <div className="p-4 bg-muted/10 text-center">
                <Link href="/applications" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline flex items-center justify-center">
                  View all applications <ArrowRight className="w-3 h-3 ml-2" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Info/Utility Board */}
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-bold uppercase tracking-tight">Upcoming</h2>
          <div className="border border-border divide-y divide-border">
            <div className="p-4 bg-muted/10 flex flex-col items-center justify-center text-center space-y-2 h-40">
              <Clock className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-bold text-muted-foreground">No upcoming events</p>
              <p className="text-xs text-muted-foreground/70">Your schedule is clear.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
