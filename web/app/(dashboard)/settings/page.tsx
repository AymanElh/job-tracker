'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { 
  User, 
  Lock, 
  Save, 
  Loader2, 
  ShieldCheck,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  passwordCurrent: z.string().min(1, 'Current password is required'),
  password: z.string().min(8, 'New password must be at least 8 characters'),
  passwordConfirm: z.string().min(8, 'Please confirm your new password'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      setProfileValue('name', user.name);
      setProfileValue('email', user.email);
    }
  }, [user, setProfileValue]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await api.patch('/auth/updateMe', data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data.data.user);
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const response = await api.patch('/auth/updatePassword', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password updated successfully!');
      resetPassword();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  });

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    updatePasswordMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      {/* Header */}
      <header>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.2em] mb-2">Configure Workspace</p>
        <h1 className="text-4xl font-heading font-black tracking-tighter">
          SYSTEM<span className="text-primary">SETTINGS</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Left Nav (Simulated) */}
        <div className="space-y-1">
          <div className="p-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-3">
            <UserCircle className="w-4 h-4" /> Account Profile
          </div>
          <div className="p-4 text-muted-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-muted transition-colors cursor-pointer">
            <ShieldCheck className="w-4 h-4" /> Security & Access
          </div>
        </div>

        {/* Forms Area */}
        <div className="md:col-span-2 space-y-12">
          {/* Profile Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading font-black uppercase tracking-tight">Profile Information</h2>
            </div>

            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input
                  {...registerProfile('name')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none h-12"
                />
                {profileErrors.name && <p className="text-[10px] text-destructive font-bold">{profileErrors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                <Input
                  {...registerProfile('email')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none h-12"
                />
                {profileErrors.email && <p className="text-[10px] text-destructive font-bold">{profileErrors.email.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold tracking-tight rounded-none"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> UPDATE PROFILE
                  </>
                )}
              </Button>
            </form>
          </section>

          {/* Password Section */}
          <section className="space-y-6 pt-12 border-t border-border/50">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-heading font-black uppercase tracking-tight">Security & Password</h2>
            </div>

            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Password</Label>
                <Input
                  type="password"
                  {...registerPassword('passwordCurrent')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none h-12"
                />
                {passwordErrors.passwordCurrent && <p className="text-[10px] text-destructive font-bold">{passwordErrors.passwordCurrent.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Password</Label>
                <Input
                  type="password"
                  {...registerPassword('password')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none h-12"
                />
                {passwordErrors.password && <p className="text-[10px] text-destructive font-bold">{passwordErrors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</Label>
                <Input
                  type="password"
                  {...registerPassword('passwordConfirm')}
                  className="bg-muted/20 border-border focus:border-primary rounded-none h-12"
                />
                {passwordErrors.passwordConfirm && <p className="text-[10px] text-destructive font-bold">{passwordErrors.passwordConfirm.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="h-12 px-8 border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground font-heading font-bold tracking-tight rounded-none transition-all"
              >
                {updatePasswordMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" /> CHANGE PASSWORD
                  </>
                )}
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
