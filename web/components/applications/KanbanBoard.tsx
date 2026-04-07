'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import { Loader2, MapPin, ExternalLink, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
const COLUMNS = [
  { id: 'applied', title: 'Applied' },
  { id: 'screening', title: 'Screening' },
  { id: 'technical', title: 'Technical' },
  { id: 'interview', title: 'Onsite' },
  { id: 'offer', title: 'Offer' },
];

interface Application {
  _id: string;
  company: string;
  title: string;
  status: string;
  location?: string;
  url?: string;
}

// --- Kanban Card Component ---
function KanbanCard({ app, isOverlay = false }: { app: Application; isOverlay?: boolean }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: app._id,
    data: {
      type: 'Application',
      app,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-30 border border-primary/50 bg-muted/20 h-24 mb-3" 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border border-border bg-card/50 hover:border-primary/50 transition-colors group mb-3 relative touch-none",
        isOverlay && "border-primary shadow-2xl shadow-primary/20 rotate-2 scale-105"
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{app.company}</p>
          <p className="text-xs text-muted-foreground font-medium truncate mb-2">{app.title}</p>
        </div>
        <div 
          {...attributes} 
          {...listeners} 
          className="p-1 cursor-grab hover:text-primary transition-colors text-muted-foreground/30"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          <MapPin className="w-3 h-3" />
          {app.location || 'Remote'}
        </div>
        {app.url && (
          <a href={app.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// --- Kanban Column Component ---
function KanbanColumn({ id, title, apps }: { id: string; title: string; apps: Application[] }) {
  const { setNodeRef } = useSortable({
    id,
    data: {
      type: 'Column',
    },
  });

  return (
    <div className="flex flex-col w-72 min-h-[500px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">{title}</h3>
          <span className="text-[10px] font-bold py-0.5 px-2 bg-muted text-muted-foreground rounded-full">
            {apps.length}
          </span>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 p-2 bg-muted/10 border border-transparent hover:border-border/50 transition-colors"
      >
        <SortableContext items={apps.map(a => a._id)} strategy={verticalListSortingStrategy}>
          {apps.map((app) => (
            <KanbanCard key={app._id} app={app} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  search: string;
  status?: string;
  city?: string;
  appliedVia?: string;
}

// --- Main Kanban Board ---
export default function KanbanBoard({ search, status, city, appliedVia }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [activeApp, setActiveApp] = useState<Application | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', { search, type: 'kanban', status, city, appliedVia }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (city) params.append('city', city);
      if (appliedVia) params.append('appliedVia', appliedVia);
      
      params.append('limit', '50'); // Show more on kanban

      const response = await api.get(`/applications?${params.toString()}`);
      const items = response.data.data || [];
      return {
        ...response.data,
        items: items.map((app: Record<string, any>) => ({
          ...app,
          title: app.jobTitle,
          company: app?.company?.name,
          location: app?.location?.city,
          url: app.jobUrl,
        })),
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/applications/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useMemo(() => {
    const apps = data?.items || [];
    return COLUMNS.map(col => ({
      ...col,
      apps: apps.filter((a: Application) => a.status === col.id),
    }));
  }, [data]);

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Application') {
      setActiveApp(event.active.data.current.app);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;

    const activeApp = active.data.current?.app as Application;
    const overId = over.id as string;
    
    // Check if we dropped over a column
    const isColumn = COLUMNS.some(c => c.id === overId);
    let newStatus = activeApp.status;

    if (isColumn) {
      newStatus = overId;
    } else {
      // Check if we dropped over another card
      const overApp = data?.items.find((a: Application) => a._id === overId);
      if (overApp) {
        newStatus = overApp.status;
      }
    }

    if (newStatus !== activeApp.status) {
      updateStatusMutation.mutate({ id: activeApp._id, status: newStatus });
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Syncing your board...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[600px] scrollbar-hide">
        {columns.map((col) => (
          <KanbanColumn key={col.id} id={col.id} title={col.title} apps={col.apps} />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeApp ? <KanbanCard app={activeApp} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
