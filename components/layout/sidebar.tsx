"use client";
import { useMemo } from 'react'
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Package2, Users, FileSpreadsheet, AlertCircle, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/auth/user-button";
import { useAuth } from "@/components/auth/auth-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { PanelRightOpen , PanelRightClose} from "lucide-react";
import { SidebarToggle } from '../collapsed-toggle';

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    description: "Overview and analytics",
  },
  {
    label: "Suppliers",
    icon: Users,
    href: "/dashboard/suppliers",
    description: "Manage your suppliers",
  },
  {
    label: "Products",
    icon: Package2,
    href: "/dashboard/products",
    description: "View and manage products",
  },
  {
    label: "Imports",
    icon: FileSpreadsheet,
    href: "/dashboard/imports",
    description: "Import product data",
  },
  {
    label: "Reports",
    icon: AlertCircle,
    href: "/dashboard/reports",
    description: "View analytics and reports",
  },
];

export function Sidebar({ collapsed , setCollapsed }: { collapsed: boolean, setCollapsed: React.Dispatch<React.SetStateAction<boolean>>}) {
  const pathname = usePathname();
  const { session } = useAuth();

  const activeRoute = useMemo(() => {
    return routes
      .filter((route) => {
        return (
          pathname === route.href || pathname.startsWith(`${route.href}/`)
        )
      })
      .sort((a, b) => b.href.length - a.href.length)[0] // Prend la plus longue (la plus spécifique)
  }, [pathname, routes])

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex h-[60px] items-center border-b px-4">
        <Link 
          href="/dashboard" 
          className={cn(
            "flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity",
            collapsed && "justify-center"
          )}
        >
          <Package2 className="h-6 w-6 flex-shrink-0 text-brand-pink" />
          {!collapsed && <span>Supplier Hub</span>}
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {routes.map((route) => {
            const isActive = route.href === activeRoute?.href;
            
            return (
              <Tooltip key={route.href} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2",
                      isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Link href={route.href}>
                      <route.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && route.label}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {route.label}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-2">
        <ThemeToggle collapsed={collapsed} />
      </div>
      <div>
      <SidebarToggle collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>
      <Separator />
      <div className="p-4">
        <UserButton collapsed={collapsed} />
      </div>
    </div>
  );
}