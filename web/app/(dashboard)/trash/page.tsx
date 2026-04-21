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
import { format } from 'date-fns';
import { 
  Loader2, 
  Trash2, 
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';

export default function TrashPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['applications-trash'],
    queryFn: async () => {
      const response = await api.get('/applications/trash?limit=50');
      // The API returns paginated response inside data.data for paginated wrapper
      return response.data.data || [];
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.patch(`/applications/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications-trash'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications-stats'] });
      toast.success('Application restored');
    },
    onError: () => {
      toast.error('Failed to restore application');
    }
  });

  const hardDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/applications/${id}/hard`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications-trash'] });
      toast.success('Application permanently deleted');
    },
    onError: () => {
      toast.error('Failed to delete application permanently');
    }
  });

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id);
  };

  const handleHardDelete = (id: string) => {
    if (window.confirm('Are you sure you want to PERMANENTLY delete this application? This action cannot be undone.')) {
      hardDeleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="border border-border bg-card/30 p-8">
        <h1 className="text-3xl font-heading font-black tracking-tighter mb-2">
          TRASH<span className="text-primary">BIN</span>
        </h1>
        <p className="text-muted-foreground font-medium">
          Deleted applications are kept here. You can restore them or permanently delete them.
        </p>
      </div>

      <div className="border border-border bg-card/30 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 px-6">Company & Role</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4">Deleted (Approx)</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 px-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-medium">
                  Your trash is empty.
                </TableCell>
              </TableRow>
            ) : (
              data.map((app: any) => (
                <TableRow key={app._id} className="border-border hover:bg-muted/10 transition-colors group">
                  <TableCell className="px-6 py-4 whitespace-normal">
                    <div className="space-y-1 min-w-0">
                      <p className="font-bold text-base text-foreground block leading-tight">
                        {app.company?.name || 'Unknown Company'}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium leading-tight">{app.jobTitle}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {format(new Date(app.updatedAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(app._id)}
                        disabled={restoreMutation.isPending || hardDeleteMutation.isPending}
                        className="h-8 text-[10px] font-bold uppercase tracking-widest rounded-none hover:text-emerald-500"
                        title="Restore"
                      >
                        <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleHardDelete(app._id)}
                        disabled={restoreMutation.isPending || hardDeleteMutation.isPending}
                        className="h-8 text-[10px] font-bold uppercase tracking-widest rounded-none"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}