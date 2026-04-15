'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Loader2, 
  ExternalLink, 
  MapPin, 
  Eye, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

const statusColors: Record<string, string> = {
  planned: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  applied: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  screening: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  technical: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  interview: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  offer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  withdrawn: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

interface ApplicationListProps {
  search: string;
  page: number;
  setPage: (page: number) => void;
  sort: string;
  setSort: (sort: string) => void;
  status?: string;
  city?: string;
  appliedVia?: string;
}

const statusDotColors: Record<string, string> = {
  planned: 'bg-indigo-500',
  applied: 'bg-blue-500',
  screening: 'bg-purple-500',
  technical: 'bg-orange-500',
  interview: 'bg-yellow-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-red-500',
  withdrawn: 'bg-muted-foreground',
};

export default function ApplicationList({ 
  search, 
  page, 
  setPage, 
  sort, 
  setSort,
  status,
  city,
  appliedVia
}: ApplicationListProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['applications', { search, page, sort, status, city, appliedVia }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (city) params.append('city', city);
      if (appliedVia) params.append('appliedVia', appliedVia);
      
      params.append('page', page.toString());
      params.append('limit', '10');
      params.append('sort', sort);

      const response = await api.get(`/applications?${params.toString()}`);
      const result = response.data;
      const items = result.data || [];
      const paginationData = result.pagination || { page: 1, pages: 1, total: 0 };
      
      return {
        items: items.map((app: Record<string, any>) => ({
          ...app,
          title: app.jobTitle,
          company: app?.company?.name,
          location: app?.location?.city,
          url: app.jobUrl,
        })),
        pagination: {
          page: paginationData.page,
          pages: paginationData.pages,
          total: paginationData.total
        }
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/applications/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application deleted');
    },
    onError: () => {
      toast.error('Failed to delete application');
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground font-body">Loading your applications...</p>
      </div>
    );
  }

  const applications = data?.items || [];
  const pagination = data?.pagination;

  if (applications.length === 0) {
    return (
      <div className="p-20 border border-border bg-muted/5 text-center">
        <p className="text-lg font-bold mb-2">{search ? 'No results found' : 'Build your pipeline'}</p>
        <p className="text-muted-foreground text-sm">
          {search ? `We couldn't find anything matching "${search}"` : "You haven't added any applications yet. Click 'New Application' to start."}
        </p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary">
              {pagination?.total || 0} Total Applications
            </p>
          </div>
          {search && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Filtering by: <span className="text-foreground">&quot;{search}&quot;</span>
            </p>
          )}
        </div>
      </div>

      <div className="border border-border bg-card/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[200px] md:w-[250px] text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 px-4 md:px-6">Company & Role</TableHead>
              <TableHead className="hidden md:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Source</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 w-[120px] md:w-[160px]">Status</TableHead>
              <TableHead className="hidden sm:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Location</TableHead>
              <TableHead className="hidden xs:table-cell text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">
                <button 
                  onClick={() => setSort(sort === 'appliedAt' ? '-appliedAt' : 'appliedAt')}
                  className="flex items-center gap-1 hover:text-primary transition-colors uppercase"
                >
                  Date
                  {sort === 'appliedAt' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : sort === '-appliedAt' ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3" />
                  )}
                </button>
              </TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 px-4 md:px-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app: Record<string, any>) => (
              <TableRow key={app._id} className="border-border hover:bg-muted/10 transition-colors group">
                <TableCell className="px-4 md:px-6 py-4 whitespace-normal">
                  <div className="space-y-1 min-w-0">
                    <Link href={`/applications/${app._id}`} className="font-bold text-sm md:text-base text-foreground hover:text-primary transition-colors block leading-tight">
                      {app.company}
                    </Link>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight">{app.title}</p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="space-y-1">
                    {app.appliedVia && (
                      <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0 rounded-none">
                        Via: {app.appliedVia.replace('-', ' ')}
                      </Badge>
                    )}
                    {app.foundOn && (
                      <div className="text-[10px] text-muted-foreground">
                        Found on: <span className="capitalize">{app.foundOn.replace('-', ' ')}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    defaultValue={app.status} 
                    onValueChange={(val) => updateStatusMutation.mutate({ id: app._id, status: val })}
                  >
                    <SelectTrigger className={`h-8 text-[10px] md:text-xs font-bold uppercase tracking-tight rounded-full px-3 border transition-all ${statusColors[app.status]}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusDotColors[app.status]}`} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      {Object.keys(statusColors).map((status) => (
                        <SelectItem key={status} value={status} className="capitalize text-xs font-medium">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${statusDotColors[status]}`} />
                            {status.replace('-', ' ')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <MapPin className="w-3 h-3" />
                    {app.location || 'Remote'}
                  </div>
                </TableCell>
                <TableCell className="hidden xs:table-cell text-[10px] md:text-xs text-muted-foreground font-medium">
                  {format(new Date(app.appliedAt || app.createdAt), 'MMM dd')}
                </TableCell>
                <TableCell className="text-right px-4 md:px-6">
                  <div className="flex items-center justify-end gap-1">
                    <Link 
                      href={`/applications/${app._id}`}
                      className="p-1 md:p-2 text-muted-foreground hover:text-primary transition-colors"
                      title="View Application"
                    >
                      <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Link>
                    <Link 
                      href={`/applications/${app._id}/edit`}
                      className="p-1 md:p-2 text-muted-foreground hover:text-blue-500 transition-colors"
                      title="Edit Application"
                    >
                      <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Link>
                    {app.url && (
                      <a 
                        href={app.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1 md:p-2 text-muted-foreground hover:text-green-500 transition-colors"
                        title="Job Posting URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </a>
                    )}
                    <button 
                      onClick={() => handleDelete(app._id)}
                      className="p-1 md:p-2 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6 bg-card/50 border border-border mt-6">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Showing <span className="text-foreground">{(pagination.page - 1) * 10 + 1}</span> to <span className="text-foreground">{Math.min(pagination.page * 10, pagination.total)}</span> of <span className="text-foreground">{pagination.total}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => {
                setPage(pagination.page - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-9 px-4 border-border font-bold text-[10px] uppercase tracking-widest rounded-none hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            
            <div className="flex items-center bg-muted/20 border border-border p-1">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.pages || (p >= pagination.page - 1 && p <= pagination.page + 1))
                .map((p, index, array) => {
                  const showEllipsis = index > 0 && p !== array[index - 1] + 1;
                  return (
                    <div key={p} className="flex items-center">
                      {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                      <button
                        onClick={() => {
                          setPage(p);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`h-7 w-7 text-[10px] font-black transition-all ${
                          pagination.page === p 
                            ? 'bg-primary text-primary-foreground scale-110 shadow-lg' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => {
                setPage(pagination.page + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-9 px-4 border-border font-bold text-[10px] uppercase tracking-widest rounded-none hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
