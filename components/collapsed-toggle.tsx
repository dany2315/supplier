"use client"

import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarToggleProps {
  collapsed: boolean
  setCollapsed: (value: boolean) => void
}

export function SidebarToggle({ collapsed, setCollapsed }: SidebarToggleProps) {
  const button = (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setCollapsed(!collapsed)}
      className={cn(
        "z-50 hidden md:flex transition-all duration-300 hover:bg-primary/90",
        collapsed ? "w-full" : "w-full justify-center gap-2"
      )}
    >
      {collapsed ? (
        <PanelRightClose className="h-4 w-4" />
      ) : (
        <PanelRightOpen className="h-4 w-4" />
      )}
    </Button>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="right">
          Expand sidebar
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}
