'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const applicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  companyEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  title: z.string().min(1, 'Job title is required'),
  status: z.enum(['planned', 'applied', 'screening', 'technical', 'interview', 'offer', 'rejected', 'withdrawn']),
  location: z.string().optional(),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  appliedVia: z.enum(['company-website', 'linkedin', 'indeed', 'email', 'recruiter', 'other']).optional(),
  foundOn: z.enum(['linkedin', 'indeed', 'company', 'email', 'referral', 'other']).optional(),
  appliedAt: z.string().optional(),
  contractType: z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship']).optional(),
  seniority: z.enum(['junior', 'mid', 'senior', 'lead']).optional(),
  locationType: z.enum(['remote', 'hybrid', 'onsite']).optional(),
  notes: z.string().optional(),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function EditApplicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const { data: application, isLoading: isFetching } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => {
      const response = await api.get(`/applications/${id}`);
      return response.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    values: application ? {
      company: application.company?.name || '',
      companyEmail: application.company?.email || '',
      title: application.jobTitle || '',
      status: (application.status as any) || 'applied',
      location: application.location?.city || '',
      url: application.jobUrl || '',
      appliedAt: application.appliedAt ? new Date(application.appliedAt).toISOString().split('T')[0] : undefined,
      appliedVia: application.appliedVia as any || undefined,
      foundOn: application.foundOn as any || undefined,
      contractType: application.contractType as any || undefined,
      seniority: application.seniority as any || undefined,
      locationType: application.locationType as any || undefined,
      notes: application.notes || '',
    } : undefined,
  });

  const statusValue = watch('status');
  const foundOnValue = watch('foundOn');
  const appliedViaValue = watch('appliedVia');
  const contractTypeValue = watch('contractType');
  const seniorityValue = watch('seniority');
  const locationTypeValue = watch('locationType');

  useEffect(() => {
    if (application && application.jobDescription !== undefined) {
      setJobDescription(application.jobDescription || '');
    }
  }, [application]);

  const updateMutation = useMutation({
    mutationFn: async (payload: FormData) => {
      return api.patch(`/applications/${id}`, payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('Application updated successfully!');
      router.push(`/applications/${id}`);
    },
    onError: () => {
      toast.error('Failed to update application');
    }
  });

  const onSubmit = (data: ApplicationForm) => {
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
      appliedAt: data.appliedAt,
      jobDescription: jobDescription,
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

    updateMutation.mutate(formData);
  };

  if (isFetching) {
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

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link'],
      ['clean']
    ],
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Back button */}
      <Link href={`/applications/${id}`} className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-3 h-3 mr-2" /> Back to Application
      </Link>

      <div className="border border-border bg-card/30 p-8">
        <h1 className="text-3xl font-heading font-black tracking-tighter mb-8">
          EDIT <span className="text-primary">APPLICATION</span>
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Name</Label>
                <Input
                  {...register('company')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.company && <p className="text-[10px] text-destructive font-bold">{errors.company.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Email</Label>
                <Input
                  {...register('companyEmail')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.companyEmail && <p className="text-[10px] text-destructive font-bold">{errors.companyEmail.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Job Title</Label>
                <Input
                  {...register('title')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.title && <p className="text-[10px] text-destructive font-bold">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={statusValue} onValueChange={(val) => setValue('status', (val || 'applied') as any)}>
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
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contract Type</Label>
                  <Select value={contractTypeValue || ''} onValueChange={(val) => setValue('contractType', (val || undefined) as any)}>
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
                  <Select value={seniorityValue || ''} onValueChange={(val) => setValue('seniority', (val || undefined) as any)}>
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
                  <Select value={locationTypeValue || ''} onValueChange={(val) => setValue('locationType', (val || undefined) as any)}>
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
                    className="bg-muted/20 border-border focus:border-primary rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Application Date</Label>
                <Input
                  type="date"
                  {...register('appliedAt')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none [color-scheme:dark]"
                />
                {errors.appliedAt && <p className="text-[10px] text-destructive font-bold">{errors.appliedAt.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Job Posting URL</Label>
                <Input
                  {...register('url')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none"
                />
                {errors.url && <p className="text-[10px] text-destructive font-bold">{errors.url.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Notes</Label>
                <Textarea
                  {...register('notes')}
                  placeholder="Any additional details..."
                  className="bg-muted/20 border-border focus:border-primary rounded-none min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Resume / CV (Optional)</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="bg-muted/20 border-border focus:border-primary rounded-none cursor-pointer file:bg-primary file:text-primary-foreground file:border-0 file:text-[10px] file:font-black file:uppercase file:px-3 file:py-1 file:mr-3 hover:file:bg-primary/90"
                />
                <p className="text-[10px] text-muted-foreground italic">Supported: PDF, DOC, DOCX (Max 5MB)</p>
                {application?.resumeUrl && (
                  <p className="text-[10px] text-primary font-bold">
                    ✓ Current CV already uploaded
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Where did you find this?</Label>
                <Select value={foundOnValue || ''} onValueChange={(val) => setValue('foundOn', (val || undefined) as any)}>
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
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">How did you apply?</Label>
                <Select value={appliedViaValue || ''} onValueChange={(val) => setValue('appliedVia', (val || undefined) as any)}>
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

              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Job Description</Label>
                <div className="bg-muted/20 border border-border">
                  <ReactQuill 
                    theme="snow" 
                    value={jobDescription} 
                    onChange={setJobDescription} 
                    modules={modules}
                    className="min-h-[300px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-8 border-t border-border/50">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold tracking-tight rounded-none"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> SAVE CHANGES
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
