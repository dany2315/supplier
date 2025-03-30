import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // 🔐 Si pas connecté, on redirige vers login (ou accueil)
  if (!user) {
    redirect('/')
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}