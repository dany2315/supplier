"use client";

import Link from "next/link";
import { MainNav } from "@/components/navigation/main-nav";
import { UserButton } from "@/components/auth/user-button";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { LogIn, Package } from "lucide-react";
import { useState, useEffect } from "react";

export function SiteHeader() {
  const { session } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
        isScrolled 
          ? "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60" 
          : "bg-background"
      }`}
    >
      <div className="container px-8 mx-auto">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity"
            >
              <Package className="h-6 w-6" />
              <span className="hidden sm:inline">Supplier Management</span>
            </Link>
            <MainNav isAuthenticated={!!session} />
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <UserButton />
            ) : (
              <Button asChild variant="default" size="sm" className="shadow-sm">
                <Link href="/auth/login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}