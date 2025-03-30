"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { AddSupplierDialog } from "./add-supplier-dialog";

interface EditMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: {
    id: string;
    name: string;
    contact_email: string;
    ftp_host: string | null;
  };
  onSuccess: () => void;
}

export function EditMappingDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: EditMappingDialogProps) {
  const [showWarning, setShowWarning] = useState(true);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    try {
      // Delete all products for this supplier
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('supplier_id', supplier.id);

      if (productsError) throw productsError;

      // Delete all field mappings for this supplier
      const { error: mappingsError } = await supabase
        .from('field_mappings')
        .delete()
        .eq('supplier_id', supplier.id);

      if (mappingsError) throw mappingsError;

      setShowWarning(false);
      setShowMappingDialog(true);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: "Error",
        description: "Failed to prepare for mapping update",
        variant: "destructive",
      });
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setShowWarning(true);
    setShowMappingDialog(false);
    onOpenChange(false);
  };

  const handleMappingSuccess = () => {
    handleClose();
    onSuccess();
  };

  if (showMappingDialog) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Update Field Mappings</DialogTitle>
            <DialogDescription>
              Configure how your data fields map to our system
            </DialogDescription>
          </DialogHeader>

          <AddSupplierDialog
            open={true}
            onOpenChange={handleClose}
            onSupplierAdded={handleMappingSuccess}
            initialStep={supplier.ftp_host ? "field-mapping" : "basic-info"}
            editMode={{
              supplier,
              mappingOnly: true,
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AlertDialog open={open && showWarning} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Field Mappings</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <div>
              <p>
                Updating the field mappings for <span className="font-medium">{supplier.name}</span> will:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Delete all existing products for this supplier</li>
                <li>Delete the current field mappings</li>
                <li>Require you to upload a new CSV file or fetch from FTP</li>
              </ul>
              <p className="text-sm font-medium text-destructive mt-2">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}