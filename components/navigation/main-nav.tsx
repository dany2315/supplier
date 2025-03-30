"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Package2, Users, FileSpreadsheet, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const routes = [
  {
    label: "Suppliers",
    icon: Users,
    href: "/suppliers",
    requiresAuth: true,
    description: "Manage your suppliers",
  },
  {
    label: "Products",
    icon: Package2,
    href: "/products",
    requiresAuth: true,
    description: "View and manage products",
  },
  {
    label: "Imports",
    icon: FileSpreadsheet,
    href: "/imports",
    requiresAuth: true,
    description: "Import product data",
  },
  {
    label: "Reports",
    icon: AlertCircle,
    href: "/reports",
    requiresAuth: true,
    description: "View analytics and reports",
  },
];

interface MainNavProps {
  isAuthenticated: boolean;
}

export function MainNav({ isAuthenticated }: MainNavProps) {
  const pathname = usePathname();

  const visibleRoutes = routes.filter(
    (route) => !route.requiresAuth || isAuthenticated
  );

  return (
    <TooltipProvider>
      <nav className="flex items-center space-x-2">
        {visibleRoutes.map((route) => (
          <Tooltip key={route.href}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                asChild
                className={cn(
                  "h-9 px-4 py-2 hover:bg-accent/50 transition-colors",
                  pathname === route.href
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link href={route.href} className="flex items-center gap-2">
                  <route.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{route.label}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{route.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  );
}