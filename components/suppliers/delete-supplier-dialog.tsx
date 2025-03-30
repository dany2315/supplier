"use client";

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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: {
    id: string;
    name: string;
  } | null;
  onDeleted: () => void;
}

interface AssociatedData {
  productsCount: number;
  mappingsCount: number;
  isLoading: boolean;
}

export function DeleteSupplierDialog({
  open,
  onOpenChange,
  supplier,
  onDeleted,
}: DeleteSupplierDialogProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [associatedData, setAssociatedData] = useState<AssociatedData>({
    productsCount: 0,
    mappingsCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (supplier) {
      fetchAssociatedData();
    }
  }, [supplier]);

  const fetchAssociatedData = async () => {
    if (!supplier) return;

    setAssociatedData(prev => ({ ...prev, isLoading: true }));
    try {
      // Get products count
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplier.id);

      if (productsError) throw productsError;

      // Get field mappings count
      const { count: mappingsCount, error: mappingsError } = await supabase
        .from('field_mappings')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplier.id);

      if (mappingsError) throw mappingsError;

      setAssociatedData({
        productsCount: productsCount || 0,
        mappingsCount: mappingsCount || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching associated data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch associated data",
        variant: "destructive",
      });
      setAssociatedData({
        productsCount: 0,
        mappingsCount: 0,
        isLoading: false,
      });
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;

    setIsDeleting(true);
    try {
      // Delete products first
      if (associatedData.productsCount > 0) {
        const { error: productsError } = await supabase
          .from('products')
          .delete()
          .eq('supplier_id', supplier.id);

        if (productsError) throw productsError;
      }

      // Delete field mappings
      if (associatedData.mappingsCount > 0) {
        const { error: mappingsError } = await supabase
          .from('field_mappings')
          .delete()
          .eq('supplier_id', supplier.id);

        if (mappingsError) throw mappingsError;
      }

      // Finally, delete the supplier
      const { error: supplierError } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id);

      if (supplierError) throw supplierError;

      toast({
        title: "Success",
        description: "Supplier and all associated data deleted successfully",
      });

      onDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "Error",
        description: "Failed to delete supplier. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Are you sure you want to delete <span className="font-medium">{supplier?.name}</span>?
            </p>

            {associatedData.isLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading associated data...
              </div>
            ) : (
              <div className="space-y-2">
                <p>This action will also delete:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>
                    <span className="font-medium">{associatedData.productsCount}</span> associated products
                  </li>
                  <li>
                    <span className="font-medium">{associatedData.mappingsCount}</span> field mappings
                  </li>
                </ul>
              </div>
            )}

            <p className="text-sm font-medium text-destructive mt-4">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={associatedData.isLoading || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}