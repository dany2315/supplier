"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

interface UserButtonProps {
  collapsed?: boolean;
}

export function UserButton({ collapsed }: UserButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user.id) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    }

    loadProfile();
  }, [session]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const button = (
    <Button 
      variant="ghost" 
      size="icon"
      className="h-9 w-9 rounded-full hover:bg-accent/50 transition-colors"
    >
      <Avatar className="h-8 w-8">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile?.full_name || ''} />
        ) : (
          <AvatarFallback>
            {profile?.full_name ? getInitials(profile.full_name) : <User className="h-5 w-5" />}
          </AvatarFallback>
        )}
      </Avatar>
    </Button>
  );

  const content = (
    <DropdownMenuContent align="end" className="w-56">
      {!collapsed && profile?.full_name && (
        <>
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user.email}
            </p>
          </div>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem className="cursor-pointer">
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {button}
              </DropdownMenuTrigger>
              {content}
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-medium">{profile?.full_name}</p>
          <p className="text-xs text-muted-foreground">{session?.user.email}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-4 w-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {button}
        </DropdownMenuTrigger>
        {content}
      </DropdownMenu>
      <div className="flex-1 min-w-0">
        {profile?.full_name && (
          <div className="truncate">
            <p className="text-sm font-medium">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {session?.user.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}