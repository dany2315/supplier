"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { DataTable } from '@/components/suppliers/data-table';
import { getColumns, Supplier } from '@/components/suppliers/columns';
import { AddSupplierDialog } from '@/components/suppliers/add-supplier-dialog';
import { DeleteSupplierDialog } from '@/components/suppliers/delete-supplier-dialog';
import { UploadProductsDialog } from '@/components/suppliers/upload-products-dialog';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { SuppliersTableSkeleton } from '@/components/suppliers/suppliers-table-skeleton';
import { useRouter } from 'next/navigation';
import { SortingState } from '@tanstack/react-table';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToUpload, setSupplierToUpload] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchSuppliers();
  }, [sorting, globalFilter, pagination.pageIndex, pagination.pageSize]);

  async function fetchSuppliers() {
    setIsLoading(true);
    try {
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' });

      // Apply search filter if exists
      if (globalFilter) {
        query = query.or(`name.ilike.%${globalFilter}%,contact_email.ilike.%${globalFilter}%`);
      }

      // Apply sorting
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        query = query.order(id, { ascending: !desc });
      } else {
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      const from = pagination.pageIndex * pagination.pageSize;
      query = query.range(from, from + pagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching suppliers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch suppliers. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setSuppliers(data || []);
      setTotalRows(count || 0);
    } catch (error) {
      console.error('Error in fetchSuppliers:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleUploadClick = (supplier: Supplier) => {
    setSupplierToUpload(supplier);
  };

  const handleRefreshFtpClick = async (supplier: Supplier) => {
    // TODO: Implement FTP refresh functionality
    toast({
      title: "Coming Soon",
      description: "FTP refresh functionality will be available soon",
    });
  };

  const columns = getColumns({ 
    onDeleteClick: handleDeleteClick,
    onUploadClick: handleUploadClick,
    onRefreshFtpClick: handleRefreshFtpClick,
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-8 sticky top-0 bg-background border-b pb-5 z-10">
        <Button variant="ghost" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex-1">Suppliers</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={suppliers}
        sorting={sorting}
        setSorting={setSorting}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={Math.ceil(totalRows / pagination.pageSize)}
        isLoading={isLoading}
        skeleton={<SuppliersTableSkeleton />}
      />

      <AddSupplierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSupplierAdded={fetchSuppliers}
      />

      <DeleteSupplierDialog
        open={!!supplierToDelete}
        onOpenChange={(open) => !open && setSupplierToDelete(null)}
        supplier={supplierToDelete}
        onDeleted={fetchSuppliers}
      />

      <UploadProductsDialog
        open={!!supplierToUpload}
        onOpenChange={(open) => !open && setSupplierToUpload(null)}
        supplier={supplierToUpload}
        onSuccess={fetchSuppliers}
      />
    </div>
  );
}