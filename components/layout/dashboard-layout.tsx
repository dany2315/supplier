"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";


export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-background">
        <div 
          className={cn(
            "hidden md:flex flex-col fixed inset-y-0 z-50 bg-card border-r transition-all duration-300",
            collapsed ? "w-16" : "w-64"
          )}
        >
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>        
        
        <main 
          className={cn(
            "flex-1 transition-all duration-300 pt-5",
            collapsed ? "md:pl-16" : "md:pl-64"
          )}
        >
          
          <div className="px-6 relative">
            
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}