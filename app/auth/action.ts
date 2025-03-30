'use server';
;
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard'); // ou '/' selon ton app
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (existingProfile) {
    return {
      error: 'An account with this email already exists. Please log in.',
      redirectTo: '/auth/login',
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Tu peux aussi insérer une ligne en base ici si besoin

  redirect('/auth/login');
}
