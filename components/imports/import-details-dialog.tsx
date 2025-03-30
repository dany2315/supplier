"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Import } from "./columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImportDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  import_log: Import | null;
}

export function ImportDetailsDialog({
  open,
  onOpenChange,
  import_log,
}: ImportDetailsDialogProps) {
  if (!import_log) return null;

  const getDuration = () => {
    const started = new Date(import_log.started_at);
    const completed = import_log.completed_at 
      ? new Date(import_log.completed_at)
      : import_log.status === "processing" 
        ? new Date() 
        : started;
    
    return Math.round((completed.getTime() - started.getTime()) / 1000);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "processing":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Details</DialogTitle>
          <DialogDescription>
            Detailed information about this import operation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Supplier</h3>
              <p className="mt-1 text-lg font-medium">{import_log.supplier.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="mt-1">
                <Badge variant={getStatusVariant(import_log.status)}>
                  {import_log.status.charAt(0).toUpperCase() + import_log.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">File Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">File Name</h4>
                <p className="mt-1">{import_log.file_name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Import Date</h4>
                <p className="mt-1">{format(new Date(import_log.created_at), "dd/MM/yyyy HH:mm")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Total Rows</h4>
                  <p className="mt-1 text-2xl font-bold">{import_log.total_rows}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Imported</h4>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {import_log.imported_rows}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Skipped</h4>
                  <p className="mt-1 text-2xl font-bold text-yellow-600">
                    {import_log.skipped_rows}
                  </p>
                </div>
              </div>

              {/* Duration */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                <p className="mt-1">
                  {getDuration()}s
                  {import_log.status === "processing" && " (in progress)"}
                </p>
              </div>

              {/* Error Details */}
              {import_log.status === "failed" && import_log.error_details && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-destructive">Error Details</h4>
                  <p className="mt-1 text-sm text-destructive">
                    {import_log.error_details.message || "Unknown error occurred"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}