'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { 
  Loader2, 
  ArrowLeft, 
  MapPin, 
  ExternalLink, 
  Calendar, 
  Plus, 
  Mail, 
  MessageSquare, 
  Phone, 
  FileText, 
  Activity,
  UserPlus,
  Link2,
  Users,
  FileCode,
  Edit,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const statusColors: Record<string, string> = {
  applied: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  screening: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  technical: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  interview: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  offer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  withdrawn: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

const followUpIcons: Record<string, any> = {
  email: Mail,
  linkedin: MessageSquare,
  call: Phone,
  note: FileText,
  other: Activity
};

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [followUpType, setFollowUpType] = useState('email');
  const [followUpContent, setFollowUpContent] = useState('');
  
  // New state for contacts
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    role: '',
    email: '',
    linkedinUrl: '',
    phone: ''
  });

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const response = await api.get(`/applications/${id}`);
      return response.data.data;
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (payload: typeof contactForm) => {
      return api.post(`/applications/${id}/contacts`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      toast.success('Contact added successfully!');
      setContactForm({
        name: '',
        role: '',
        email: '',
        linkedinUrl: '',
        phone: ''
      });
      setIsAddingContact(false);
    },
    onError: () => {
      toast.error('Failed to add contact');
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: async (payload: typeof contactForm) => {
      return api.patch(`/applications/${id}/contacts/${editingContactId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      toast.success('Contact updated successfully!');
      setContactForm({
        name: '',
        role: '',
        email: '',
        linkedinUrl: '',
        phone: ''
      });
      setIsAddingContact(false);
      setEditingContactId(null);
    },
    onError: () => {
      toast.error('Failed to update contact');
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return api.delete(`/applications/${id}/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      toast.success('Contact deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete contact');
    }
  });

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (editingContactId) {
      updateContactMutation.mutate(contactForm);
    } else {
      addContactMutation.mutate(contactForm);
    }
  };

  const handleEditContact = (contact: any) => {
    setContactForm({
      name: contact.name || '',
      role: contact.role || '',
      email: contact.email || '',
      linkedinUrl: contact.linkedinUrl || '',
      phone: contact.phone || ''
    });
    setEditingContactId(contact._id);
    setIsAddingContact(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContactMutation.mutate(contactId);
    }
  };

  const addFollowUpMutation = useMutation({
    mutationFn: async (payload: { type: string, content: string }) => {
      return api.post(`/applications/${id}/follow-ups`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      toast.success('Follow-up added successfully!');
      setFollowUpContent('');
      setFollowUpType('email');
    },
    onError: () => {
      toast.error('Failed to add follow-up');
    }
  });

  const handleAddFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpContent.trim()) {
      toast.error('Please enter follow-up content');
      return;
    }
    addFollowUpMutation.mutate({ type: followUpType, content: followUpContent });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground font-body">Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-20 text-center">
        <p className="text-lg font-bold">Application not found</p>
        <Link href="/applications" className="text-primary hover:underline text-sm mt-4 inline-block">
          Return to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Back button & Action header */}
      <div className="flex justify-between items-center">
        <Link href="/applications" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" /> Back to Pipeline
        </Link>
        <div className="flex gap-4">
          <Link href={`/applications/${id}/edit`}>
            <Button variant="outline" className="border-border hover:bg-muted font-bold text-xs uppercase tracking-widest h-8 rounded-none">
              Edit Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Details Header */}
      <div className="border border-border bg-card/30 p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-heading font-black tracking-tighter mb-2">
              {application.company?.name || 'Unknown Company'}
            </h1>
            <p className="text-xl text-muted-foreground font-medium">
              {application.jobTitle}
            </p>
          </div>
          <Badge variant="outline" className={`${statusColors[application.status]} px-4 py-1.5 text-xs uppercase font-black tracking-widest rounded-none border-2`}>
            {application.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            {application.location?.city || 'Remote'}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4 text-primary" />
            Applied: {format(new Date(application.appliedAt || application.createdAt), 'MMM dd, yyyy')}
          </div>
          {application.appliedVia && (
            <div className={`flex items-center gap-2 text-sm font-medium ${application.appliedVia === 'email' ? 'text-primary' : 'text-muted-foreground'}`}>
              <span className="font-bold uppercase tracking-widest text-[10px]">Via:</span>
              <span className="capitalize">{application.appliedVia.replace('-', ' ')}</span>
              {application.appliedVia === 'email' && application.company?.email && (
                <span className="text-xs">({application.company.email})</span>
              )}
            </div>
          )}
          {application.foundOn && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <span className="font-bold uppercase tracking-widest text-[10px]">Source:</span>
              <span className="capitalize">{application.foundOn.replace('-', ' ')}</span>
            </div>
          )}
          {application.company?.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <Mail className="w-4 h-4 text-primary" />
              <a href={`mailto:${application.company.email}`} className="hover:underline text-primary">
                {application.company.email}
              </a>
            </div>
          )}
          {application.jobUrl && (
            <a 
              href={application.jobUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <ExternalLink className="w-4 h-4" /> View Posting
            </a>
          )}
          {application.resumeUrl && (
            <a 
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${application.resumeUrl}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-emerald-500 hover:underline font-medium"
            >
              <FileCode className="w-4 h-4" /> View Resume / CV
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Job Description */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border bg-card/30 p-8">
            <h2 className="text-lg font-heading font-black uppercase tracking-widest mb-6 border-b border-border/50 pb-4">Job Description</h2>
            {application.jobDescription ? (
              <div 
                className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:my-0 text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: application.jobDescription }}
              />
            ) : (
              <p className="text-muted-foreground text-sm italic">No job description provided. Click Edit Details to add one.</p>
            )}
          </div>
        </div>

        {/* Right Column: Contacts & Follow-ups */}
        <div className="space-y-6">
          {/* Contacts Section */}
          <div className="border border-border bg-card/30 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-heading font-black uppercase tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Key Contacts
              </h2>
              <button 
                onClick={() => {
                  if (isAddingContact && editingContactId) {
                    setEditingContactId(null);
                    setContactForm({ name: '', role: '', email: '', linkedinUrl: '', phone: '' });
                  } else {
                    setIsAddingContact(!isAddingContact);
                  }
                }}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            {isAddingContact && (
              <form onSubmit={handleAddContact} className="space-y-3 mb-6 p-4 bg-muted/20 border border-border/50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                  {editingContactId ? 'Edit Contact' : 'Add New Contact'}
                </h3>
                <Input 
                  placeholder="Name (Required)" 
                  value={contactForm.name}
                  onChange={e => setContactForm({...contactForm, name: e.target.value})}
                  className="bg-background text-xs h-8 rounded-none"
                />
                <Input 
                  placeholder="Role (Recruiter, Manager...)" 
                  value={contactForm.role}
                  onChange={e => setContactForm({...contactForm, role: e.target.value})}
                  className="bg-background text-xs h-8 rounded-none"
                />
                <Input 
                  placeholder="Email" 
                  value={contactForm.email}
                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                  className="bg-background text-xs h-8 rounded-none"
                />
                <Input 
                  placeholder="LinkedIn URL" 
                  value={contactForm.linkedinUrl}
                  onChange={e => setContactForm({...contactForm, linkedinUrl: e.target.value})}
                  className="bg-background text-xs h-8 rounded-none"
                />
                <div className="flex gap-2 pt-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={addContactMutation.isPending || updateContactMutation.isPending}
                    className="flex-1 text-[10px] font-bold uppercase rounded-none h-7"
                  >
                    {editingContactId 
                      ? (updateContactMutation.isPending ? 'Updating...' : 'Update Contact') 
                      : (addContactMutation.isPending ? 'Adding...' : 'Add Contact')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsAddingContact(false);
                      setEditingContactId(null);
                      setContactForm({ name: '', role: '', email: '', linkedinUrl: '', phone: '' });
                    }}
                    className="text-[10px] font-bold uppercase rounded-none h-7"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {application.contacts?.length > 0 ? (
                application.contacts.map((contact: any) => (
                  <div key={contact._id} className="p-3 bg-muted/10 border border-border/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-xs">{contact.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{contact.role || 'No Role Provided'}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEditContact(contact)}
                          className="p-1 text-muted-foreground hover:text-primary transition-colors"
                          title="Edit Contact"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteContact(contact._id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 pt-1">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium bg-background/40 border border-border/50 p-1.5 px-2">
                          <Mail className="w-3 h-3 text-primary" />
                          <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors truncate">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {contact.linkedinUrl && (
                          <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-background border border-border hover:border-primary transition-colors group">
                            <Link2 className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="p-1.5 bg-background border border-border hover:border-primary transition-colors group">
                            <Phone className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic">No specific contacts added yet.</p>
              )}
            </div>
          </div>

          {/* Follow-ups section (keep existing) */}
          <div className="border border-border bg-card/30 p-6">
            <h2 className="text-sm font-heading font-black uppercase tracking-widest mb-6">Timeline & Follow-ups</h2>
            
            {/* Follow-up List */}
            <div className="space-y-6 mb-8 border-l-2 border-border/50 ml-3 pl-6">
              {application.followUps?.length > 0 ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                application.followUps.map((fu: any, index: number) => {
                  const Icon = followUpIcons[fu.type] || Activity;
                  return (
                    <div key={index} className="relative">
                      <div className="absolute -left-[35px] bg-background p-1 border border-border rounded-full">
                        <Icon className="w-3 h-3 text-primary" />
                      </div>
                      <div className="bg-muted/20 border border-border/50 p-3 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-[10px] uppercase tracking-widest capitalize text-foreground">{fu.type}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(fu.sentAt), 'MMM dd, h:mm a')}</span>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">{fu.content}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground italic">No follow-ups recorded yet.</p>
              )}
            </div>

            {/* Add Follow-up Form */}
            <form onSubmit={handleAddFollowUp} className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="text-xs font-bold uppercase tracking-widest">Add Activity</h3>
              <div className="flex gap-2">
                <div className="w-1/3">
                  <Select value={followUpType} onValueChange={(val) => setFollowUpType(val || 'email')}>
                    <SelectTrigger className="bg-muted/20 border-border text-xs rounded-none h-10">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Textarea 
                    value={followUpContent}
                    onChange={(e) => setFollowUpContent(e.target.value)}
                    placeholder="What happened?"
                    className="bg-muted/20 border-border focus:border-primary text-xs min-h-[40px] rounded-none resize-none"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={addFollowUpMutation.isPending}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold tracking-tight rounded-none text-xs"
              >
                {addFollowUpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'RECORD ACTIVITY'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
