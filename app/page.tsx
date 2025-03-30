"use client";

import { Button } from '@/components/ui/button';
import { Package2, Users, FileSpreadsheet, ArrowRight, CheckCircle2, Zap, Shield, LineChart } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from "next/navigation";
import { useEffect } from 'react';

export default function LandingPage() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [ session, router])


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/10 via-brand-teal/10 to-brand-blue/10" />
        <div className="container mx-auto px-4 py-24">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="flex items-center justify-center">
              <Package2 className="h-20 w-20 text-brand-pink" />
            </div>
            <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
              Supplier Management
              <span className="block text-brand-pink">Made Simple</span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Streamline your supplier relationships, automate inventory management, and boost efficiency with our comprehensive platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg">
                <Link href="/auth/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">
              Powerful features to help you manage your supply chain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-background p-6 rounded-lg shadow-sm border">
              <Users className="h-12 w-12 text-brand-teal mb-4" />
              <h3 className="text-xl font-semibold mb-2">Supplier Management</h3>
              <p className="text-muted-foreground">
                Centralize and organize all your supplier information in one place
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg shadow-sm border">
              <Package2 className="h-12 w-12 text-brand-yellow mb-4" />
              <h3 className="text-xl font-semibold mb-2">Inventory Control</h3>
              <p className="text-muted-foreground">
                Track stock levels and manage product data with ease
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg shadow-sm border">
              <FileSpreadsheet className="h-12 w-12 text-brand-blue mb-4" />
              <h3 className="text-xl font-semibold mb-2">Data Import</h3>
              <p className="text-muted-foreground">
                Automate updates with CSV and FTP integration
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg shadow-sm border">
              <LineChart className="h-12 w-12 text-brand-pink mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analytics</h3>
              <p className="text-muted-foreground">
                Gain insights with powerful reporting tools
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground text-lg">
              Built for modern businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-brand-yellow" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Optimized performance for quick access to your data
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-brand-teal" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure</h3>
              <p className="text-muted-foreground">
                Enterprise-grade security to protect your data
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-brand-pink" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
              <p className="text-muted-foreground">
                Intuitive interface designed for efficiency
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of businesses already using our platform to streamline their operations.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="text-lg">
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link href="/auth/login">
                  Sign In to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}