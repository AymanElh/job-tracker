'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

const applicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  companyEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  title: z.string().min(1, 'Job title is required'),
  status: z.enum(['planned', 'applied', 'screening', 'technical', 'interview', 'offer', 'rejected', 'withdrawn']),
  location: z.string().optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  appliedVia: z.enum(['company-website', 'linkedin', 'indeed', 'email', 'recruiter', 'other']).optional(),
  foundOn: z.enum(['linkedin', 'indeed', 'company', 'email', 'referral', 'other']).optional(),
  contractType: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).optional(),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead']).optional(),
  locationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  notes: z.string().optional(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

interface NewApplicationSheetProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export default function NewApplicationSheet({ onSuccess, children }: NewApplicationSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      status: 'applied',
    },
  });

  const onSubmit = async (data: ApplicationForm) => {
    setLoading(true);
    try {
      const applicationData = {
        jobTitle: data.title,
        company: { 
          name: data.company,
          email: data.companyEmail,
        },
        status: data.status,
        jobUrl: data.url,
        location: data.location ? { city: data.location } : undefined,
        appliedVia: data.appliedVia,
        foundOn: data.foundOn,
        contractType: data.contractType,
        seniority: data.seniority,
        locationType: data.locationType,
        notes: data.notes,
      };

      const formData = new FormData();
      formData.append('data', JSON.stringify(applicationData));
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await api.post('/applications', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Application tracked successfully!');
      reset();
      setResumeFile(null);
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to track application');
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    toast.error('Please fix the validation errors in the form.');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          (children as React.ReactElement) || (
            <button className="flex items-center gap-2 h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold tracking-tight transition-colors">
              <Plus className="w-4 h-4" /> NEW APPLICATION
            </button>
          )
        }
      />
      <SheetContent className="bg-background border-l border-border sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="p-8 pb-0">
          <SheetTitle className="text-3xl font-heading font-black tracking-tighter">
            TRACK<span className="text-primary">NEW</span>JOB
          </SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            Enter the details of your job application to start tracking its journey.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="flex-1 flex flex-col h-full">
          <div className="flex-1 p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Name *</Label>
                <Input
                  {...register('company')}
                  placeholder="e.g. Google, Stripe"
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.company && <p className="text-[10px] text-destructive font-bold">{errors.company.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Job Title *</Label>
                <Input
                  {...register('title')}
                  placeholder="e.g. Senior Software Engineer"
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.title && <p className="text-[10px] text-destructive font-bold">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initial Status</Label>
                <Select onValueChange={(val: any) => setValue('status', val as any)} defaultValue="applied">
                  <SelectTrigger className="bg-muted/20 border-border rounded-none">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="technical">Technical Interview</SelectItem>
                    <SelectItem value="interview">Onsite Interview</SelectItem>
                    <SelectItem value="offer">Offer Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Job Posting URL</Label>
                <Input
                  {...register('url')}
                  placeholder="https://jobs.company.com/..."
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.url && <p className="text-[10px] text-destructive font-bold">{errors.url.message}</p>}
              </div>
            </div>
            
            <div className="space-y-6 pt-6 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contract Type</Label>
                  <Select onValueChange={(val: any) => setValue('contractType', val as any)}>
                    <SelectTrigger className="bg-muted/20 border-border rounded-none">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Seniority</Label>
                  <Select onValueChange={(val: any) => setValue('seniority', val as any)}>
                    <SelectTrigger className="bg-muted/20 border-border rounded-none">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid-level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Location Type</Label>
                  <Select onValueChange={(val: any) => setValue('locationType', val as any)}>
                    <SelectTrigger className="bg-muted/20 border-border rounded-none">
                      <SelectValue placeholder="Select setup" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">City</Label>
                  <Input
                    {...register('location')}
                    placeholder="e.g. San Francisco"
                    className="bg-muted/20 border-border focus:border-primary rounded-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Found On</Label>
                  <Select onValueChange={(val: any) => setValue('foundOn', val as any)}>
                    <SelectTrigger className="bg-muted/20 border-border rounded-none">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="company">Company Website</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Applied Via</Label>
                  <Select onValueChange={(val: any) => setValue('appliedVia', val as any)}>
                    <SelectTrigger className="bg-muted/20 border-border rounded-none">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="company-website">Company Website</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Email</Label>
                <Input
                  {...register('companyEmail')}
                  placeholder="hr@company.com"
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.companyEmail && <p className="text-[10px] text-destructive font-bold">{errors.companyEmail.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes</Label>
                <Textarea
                  {...register('notes')}
                  placeholder="Any additional details or things to remember..."
                  className="bg-muted/20 border-border focus:border-primary rounded-none min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resume / CV</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="bg-muted/20 border-border focus:border-primary rounded-none cursor-pointer file:bg-primary file:text-primary-foreground file:border-0 file:text-[10px] file:font-black file:uppercase file:px-3 file:py-1 file:mr-3 hover:file:bg-primary/90"
                />
                <p className="text-[10px] text-muted-foreground italic">Supported: PDF, DOC, DOCX (Max 5MB)</p>
              </div>
            </div>
          </div>

          <SheetFooter className="p-8 pt-0 mt-0">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold tracking-tight rounded-none shadow-xl shadow-primary/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SAVE APPLICATION'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}