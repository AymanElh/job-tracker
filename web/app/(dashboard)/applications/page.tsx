'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  LayoutDashboard, 
  List, 
  Download, 
  Upload, 
  Loader2, 
  X,
  MapPin
} from 'lucide-react';
import KanbanBoard from '@/components/applications/KanbanBoard';
import ApplicationList from '@/components/applications/ApplicationList';
import NewApplicationSheet from '@/components/applications/NewApplicationSheet';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function ApplicationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Helper to get initial state from URL or defaults
  const getParam = (name: string, defaultValue: string) => searchParams.get(name) || defaultValue;

  const [view, setView] = useState(getParam('view', 'list'));
  const [search, setSearch] = useState(getParam('search', ''));
  const [debouncedSearch, setDebouncedSearch] = useState(getParam('search', ''));
  const [page, setPage] = useState(parseInt(getParam('page', '1')));
  const [sort, setSort] = useState(getParam('sort', '-appliedAt'));
  const [filterStatus, setFilterStatus] = useState<string>(getParam('status', 'all'));
  const [filterCity, setFilterCity] = useState(getParam('city', ''));
  const [debouncedCity, setDebouncedCity] = useState(getParam('city', ''));
  const [filterMethod, setFilterMethod] = useState<string>(getParam('method', 'all'));

  // Update URL whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (view !== 'list') params.set('view', view);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (page > 1) params.set('page', page.toString());
    if (sort !== '-appliedAt') params.set('sort', sort);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (debouncedCity) params.set('city', debouncedCity);
    if (filterMethod !== 'all') params.set('method', filterMethod);

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Use replace to avoid polluting history with every filter change
    router.replace(url);
  }, [view, debouncedSearch, page, sort, filterStatus, debouncedCity, filterMethod, pathname, router]);

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Reset page only if search changed from original URL state
      if (search !== getParam('search', '')) {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce city
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCity(filterCity);
      // Reset page only if city changed from original URL state
      if (filterCity !== getParam('city', '')) {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filterCity]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
    queryClient.invalidateQueries({ queryKey: ['applications-stats'] });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/applications/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'applications_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Applications exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export applications');
    } finally {
      setIsExporting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        await api.post('/applications/batch', json);
        toast.success('Applications imported successfully!');
        handleRefresh();
      } catch (error: unknown) {
        console.error(error);
        toast.error('Failed to import applications. Please check your JSON format.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read the file.');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-heading font-black tracking-tighter">
            APPLICATIONS<span className="text-primary">WORKSPACE</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium tracking-tight">
            Manage your interview pipeline and track every step of the journey.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <Button 
            variant="outline" 
            onClick={triggerFileInput} 
            disabled={isImporting}
            className="border-border hover:bg-muted font-bold text-xs uppercase tracking-widest h-10 rounded-none"
          >
            {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} 
            Import JSON
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={isExporting}
            className="border-border hover:bg-muted font-bold text-xs uppercase tracking-widest h-10 rounded-none"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />} 
            Export CSV
          </Button>

          <NewApplicationSheet onSuccess={handleRefresh} />
        </div>
      </header>

      {/* Controls Area */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-card/20 p-4 border border-border">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Tabs value={view} onValueChange={setView} className="w-full md:w-auto">
            <TabsList className="bg-muted/30 border border-border h-10 p-1">
              <TabsTrigger 
                value="kanban" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 text-xs font-bold uppercase tracking-widest transition-all"
              >
                <LayoutDashboard className="w-3 h-3 mr-2" /> Kanban
              </TabsTrigger>
              <TabsTrigger 
                value="list" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 text-xs font-bold uppercase tracking-widest transition-all"
              >
                <List className="w-3 h-3 mr-2" /> List View
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="h-10 w-px bg-border mx-2 hidden lg:block" />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 flex-1 lg:flex-none">
            <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
              <SelectTrigger className="w-[130px] h-10 bg-muted/20 border-border text-[10px] font-bold uppercase">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMethod} onValueChange={(val) => { setFilterMethod(val); setPage(1); }}>
              <SelectTrigger className="w-[130px] h-10 bg-muted/20 border-border text-[10px] font-bold uppercase">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="company-website">Website</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="indeed">Indeed</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative group w-[130px]">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="City..." 
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="pl-8 h-10 bg-muted/20 border-border focus:border-primary text-[10px] font-bold uppercase transition-all"
              />
            </div>

            {(filterStatus !== 'all' || filterMethod !== 'all' || filterCity !== '' || search !== '') && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setFilterStatus('all');
                  setFilterMethod('all');
                  setFilterCity('');
                  setSearch('');
                }}
                className="h-10 px-2 text-[10px] font-bold uppercase text-muted-foreground hover:text-destructive"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search company or title..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 h-10 bg-muted/20 border-border focus:border-primary text-xs font-medium transition-all"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Work Area */}
      <div className="min-h-[600px]">
        {view === 'kanban' ? (
          <KanbanBoard 
            search={debouncedSearch} 
            status={filterStatus !== 'all' ? filterStatus : undefined}
            city={debouncedCity || undefined}
            appliedVia={filterMethod !== 'all' ? filterMethod : undefined}
          />
        ) : (
          <ApplicationList 
            search={debouncedSearch} 
            page={page} 
            setPage={setPage} 
            sort={sort}
            setSort={setSort}
            status={filterStatus !== 'all' ? filterStatus : undefined}
            city={debouncedCity || undefined}
            appliedVia={filterMethod !== 'all' ? filterMethod : undefined}
          />
        )}
      </div>
    </div>
  );
}
