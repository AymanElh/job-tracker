'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award,
  Loader2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = {
  planned: '#6366f1',
  applied: '#3b82f6',
  screening: '#a855f7',
  technical: '#f97316',
  interview: '#eab308',
  offer: '#10b981',
  rejected: '#ef4444',
  withdrawn: '#94a3b8',
};

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const response = await api.get('/applications/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Generating your insights...</p>
      </div>
    );
  }

  const rawStats = data?.data || [];
  
  // Create a sorted pipeline for the chart
  const pipelineOrder = ['planned', 'applied', 'screening', 'technical', 'interview', 'offer'];
  const chartData = pipelineOrder.map(status => {
    const stat = rawStats.find((s: any) => s.status === status);
    return {
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: stat ? stat.count : 0,
      status
    };
  });

  const totalApplications = rawStats.reduce((acc: number, curr: any) => acc + curr.count, 0);
  const plannedCount = rawStats.find((s: any) => s.status === 'planned')?.count || 0;
  const activeInterviews = rawStats.filter((s: any) => ['technical', 'interview'].includes(s.status))
    .reduce((acc: number, curr: any) => acc + curr.count, 0);
  const offersCount = rawStats.find((s: any) => s.status === 'offer')?.count || 0;
  const successRate = totalApplications > 0 ? (offersCount / totalApplications) * 100 : 0;

  return (
    <div className="space-y-12">
      {/* Header */}
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em] mb-2">Data Insights</p>
        <h1 className="text-4xl font-heading font-black tracking-tighter">
          ANALYTICS<span className="text-primary">HUB</span>
        </h1>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/30 border-border rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Scale</CardTitle>
            <BarChart3 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-black">{totalApplications}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Total Tracked</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border rounded-none border-l-primary/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Planned</CardTitle>
            <Target className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-black">{plannedCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Upcoming Pipeline</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Momentum</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-black">{activeInterviews}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Active Stages</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target Reach</CardTitle>
            <Award className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-black">{offersCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Confirmed Offers</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-border rounded-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conversion</CardTitle>
            <Target className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-heading font-black">{successRate.toFixed(1)}%</div>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">Success Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Vision Chart */}
      <div className="space-y-6">
        <h2 className="text-xl font-heading font-bold uppercase tracking-tight">Application Pipeline</h2>
        <div className="bg-card/20 border border-border p-8 h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }}
                contentStyle={{ 
                  backgroundColor: '#020617', 
                  border: '1px solid #1e293b',
                  fontSize: '12px',
                  fontWeight: 700
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
