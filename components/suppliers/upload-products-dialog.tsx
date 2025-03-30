"use client";

import { useState, useCallback } from "react";
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
import { useDropzone } from 'react-dropzone';
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Papa from 'papaparse';
import { Progress } from "@/components/ui/progress";

interface UploadProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: {
    id: string;
    name: string;
  } | null;
  onSuccess: () => void;
}

export function UploadProductsDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: UploadProductsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setCsvFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const handleClose = () => {
    if (!isLoading) {
      setCsvFile(null);
      onOpenChange(false);
    }
  };

  const processFile = async (file: File, fieldMappings: any[]) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        transform: (value) => {
          value = value.replace(/^\uFEFF/, '');
          value = value.trim();
          value = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
          return value;
        },
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  };

  const handleUpload = async () => {
    if (!supplier || !csvFile) return;

    setIsLoading(true);
    setProgress(0);
    let importLogId: string | null = null;
    const startTime = new Date();

    try {
      // Create initial import log entry
      setCurrentOperation("Initializing import...");
      setProgress(5);
      const { data: importLog, error: importLogError } = await supabase
        .from('import_logs')
        .insert({
          supplier_id: supplier.id,
          file_name: csvFile.name,
          status: 'processing',
          started_at: startTime.toISOString(),
          total_rows: 0,
          imported_rows: 0,
          skipped_rows: 0,
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

      // Create mapping object
      const fieldMappings = mappings.reduce((acc, { source_column, target_field }) => {
        acc[target_field] = source_column;
        return acc;
      }, {} as Record<string, string>);

      // Delete existing products
      setCurrentOperation("Removing existing products...");
      setProgress(20);
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('supplier_id', supplier.id);

      if (deleteError) throw deleteError;

      // Process CSV file
      setCurrentOperation("Processing CSV file...");
      setProgress(40);
      const data: any[] = await processFile(csvFile, mappings);

      // Update import log with total rows
      await supabase
        .from('import_logs')
        .update({
          total_rows: data.length,
          status: 'processing'
        })
        .eq('id', importLogId);

      // Import products in batches
      setCurrentOperation("Importing products...");
      const batchSize = 100;
      const totalBatches = Math.ceil(data.length / batchSize);
      let processedBatches = 0;
      let importedRows = 0;
      let skippedRows = 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
          .filter(row => {
            const sku = row[fieldMappings.sku]?.trim();
            const name = row[fieldMappings.name]?.trim();
            const priceHt = parseFloat(row[fieldMappings.price_ht]);
            const stock = parseInt(row[fieldMappings.stock], 10);
            
            const isValid = (
              sku && 
              name && 
              !isNaN(priceHt) && 
              !isNaN(stock) && 
              priceHt >= 0 && 
              stock >= 0
            );

            if (isValid) {
              importedRows++;
            } else {
              skippedRows++;
            }

            return isValid;
          })
          .map(row => ({
            supplier_id: supplier.id,
            sku: row[fieldMappings.sku].trim(),
            name: row[fieldMappings.name].trim(),
            price_ht: parseFloat(row[fieldMappings.price_ht]),
            stock: parseInt(row[fieldMappings.stock], 10),
          }));

        if (batch.length > 0) {
          const { error: productsError } = await supabase
            .from("products")
            .insert(batch);

          if (productsError) throw productsError;
        }

        processedBatches++;
        const progressValue = 40 + (processedBatches / totalBatches) * 60;
        setProgress(Math.round(progressValue));

        // Update import log periodically with progress
        if (processedBatches % 5 === 0 || processedBatches === totalBatches) {
          await supabase
            .from('import_logs')
            .update({
              imported_rows: importedRows,
              skipped_rows: skippedRows,
              status: 'processing'
            })
            .eq('id', importLogId);
        }
      }

      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      // Update import log with final success status
      await supabase
        .from('import_logs')
        .update({
          status: 'completed',
          imported_rows: importedRows,
          skipped_rows: skippedRows,
          completed_at: endTime.toISOString(),
        })
        .eq('id', importLogId);

      setProgress(100);
      setCurrentOperation("Upload completed successfully!");
      toast({
        title: "Success",
        description: `Imported ${importedRows} products (${skippedRows} skipped) in ${duration}s`,
      });

      handleClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error uploading products:', error);

      // Update import log with error status
      if (importLogId) {
        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
        
        await supabase
          .from('import_logs')
          .update({
            status: 'failed',
            error_details: { message: error.message },
            completed_at: endTime.toISOString(),
          })
          .eq('id', importLogId);
      }

      toast({
        title: "Error",
        description: error.message || "Failed to upload products",
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
          <DialogTitle>Upload Products</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing products for {supplier?.name}
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : csvFile 
                ? "border-primary" 
                : "border-border hover:border-primary/50"
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-muted-foreground" />
            {csvFile ? (
              <div>
                <p className="font-medium">{csvFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  Click or drag to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">
                  Drop your CSV file here or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  The file should match your configured field mappings
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!csvFile || isLoading}
          >
            {isLoading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}