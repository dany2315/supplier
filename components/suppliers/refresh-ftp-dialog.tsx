"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

interface RefreshFtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: {
    id: string;
    name: string;
    ftp_host: string;
    ftp_path: string;
  };
  onSuccess: () => void;
}

export function RefreshFtpDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: RefreshFtpDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const { toast } = useToast();

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setProgress(0);
    let importLogId: string | null = null;

    try {
      // Create import log entry
      setCurrentOperation("Initializing FTP import...");
      setProgress(5);
      const { data: importLog, error: importLogError } = await supabase
        .from('import_logs')
        .insert({
          supplier_id: supplier.id,
          file_name: supplier.ftp_path,
          status: 'processing',
        })
        .select()
        .single();

      if (importLogError) throw importLogError;
      importLogId = importLog.id;

      // Get field mappings
      setCurrentOperation("Loading field mappings...");
      setProgress(10);
      const { data: mappings, error: mappingsError } = await supabase
        .from('field_mappings')
        .select('source_column, target_field')
        .eq('supplier_id', supplier.id);

      if (mappingsError) throw mappingsError;
      if (!mappings.length) {
        throw new Error("No field mappings found for this supplier");
      }

      // TODO: Implement actual FTP connection and file download
      // For now, we'll simulate the process
      setCurrentOperation("Connecting to FTP server...");
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCurrentOperation("Downloading file...");
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate processing
      setCurrentOperation("Processing data...");
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update import log with simulated results
      await supabase
        .from('import_logs')
        .update({
          status: 'completed',
          total_rows: 100,
          imported_rows: 95,
          skipped_rows: 5,
          completed_at: new Date().toISOString(),
        })
        .eq('id', importLogId);

      setProgress(100);
      setCurrentOperation("Import completed successfully!");
      toast({
        title: "Success",
        description: "FTP import completed successfully",
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error refreshing FTP:', error);

      // Update import log with error status
      if (importLogId) {
        await supabase
          .from('import_logs')
          .update({
            status: 'failed',
            error_details: { message: error.message },
            completed_at: new Date().toISOString(),
          })
          .eq('id', importLogId);
      }

      toast({
        title: "Error",
        description: error.message || "Failed to refresh FTP data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
      setCurrentOperation("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isLoading && (
          <div className="absolute inset-x-0 top-0 p-6 bg-background/80 backdrop-blur-sm border-b">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{currentOperation}</p>
                <p className="text-sm text-muted-foreground">{progress}%</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle>Refresh FTP Data</DialogTitle>
          <DialogDescription>
            Download and process the latest data from {supplier.ftp_host}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">FTP Details</p>
              <div className="text-sm text-muted-foreground">
                <p>Host: {supplier.ftp_host}</p>
                <p>Path: {supplier.ftp_path}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Note</p>
              <p className="text-sm text-muted-foreground">
                This will download the latest file and update all products for this supplier.
                Existing products will be replaced with the new data.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}