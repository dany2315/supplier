"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Server } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { EditSupplierForm } from '@/components/suppliers/edit-supplier-form';
import { FieldMappingCard } from '@/components/suppliers/field-mapping-card';
import { DataTable } from '@/components/products/data-table';
import { getSupplierProductColumns } from '@/components/products/columns';
import { ProductsTableSkeleton } from '@/components/products/products-table-skeleton';
import { UploadProductsDialog } from '@/components/suppliers/upload-products-dialog';
import { SupplierImports } from '@/components/suppliers/supplier-imports';
import { ImportsTableSkeleton } from '@/components/imports/imports-table-skeleton';
import { subDays } from 'date-fns';

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [supplier, setSupplier] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [imports, setImports] = useState([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [importsSorting, setImportsSorting] = useState([]);
  const [importsPagination, setImportsPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalImports, setTotalImports] = useState(0);

  useEffect(() => {
    fetchSupplier();
  }, [params.id]);

  useEffect(() => {
    if (supplier) {
      fetchProducts();
      fetchImports();
    }
  }, [supplier, sorting, dateRange, pagination.pageIndex, pagination.pageSize, importsSorting, importsPagination.pageIndex, importsPagination.pageSize]);

  async function fetchSupplier() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (!data) {
        router.push('/dashboard/suppliers');
        return;
      }

      setSupplier(data);
    } catch (error) {
      console.error('Error fetching supplier:', error);
      toast({
        title: "Error",
        description: "Failed to fetch supplier details",
        variant: "destructive",
      });
      router.push('/suppliers');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('supplier_id', supplier.id);

      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        query = query.order(id, { ascending: !desc });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const from = pagination.pageIndex * pagination.pageSize;
      query = query.range(from, from + pagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setProducts(data || []);
      setTotalRows(count || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    }
  }

  async function fetchImports() {
    try {
      let query = supabase
        .from('import_logs')
        .select(`
          *,
          supplier:suppliers(name)
        `, { count: 'exact' })
        .eq('supplier_id', supplier.id);

      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
  
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      if (importsSorting.length > 0) {
        const { id, desc } = importsSorting[0];
        query = query.order(id, { ascending: !desc });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const from = importsPagination.pageIndex * importsPagination.pageSize;
      query = query.range(from, from + importsPagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setImports(data || []);
      setTotalImports(count || 0);
    } catch (error) {
      console.error('Error fetching imports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch imports",
        variant: "destructive",
      });
    }
  }

  const handleRefreshFtp = async () => {
    toast({
      title: "Coming Soon",
      description: "FTP refresh functionality will be available soon",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-8">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/dashboard/suppliers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex-1">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col py-10">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto py-4">
          <div className="flex items-center">
            <Button variant="ghost" asChild className="mr-4">
              <Link href="/dashboard/suppliers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold flex-1">{supplier.name}</h1>
            {supplier.ftp_host ? (
              <Button onClick={handleRefreshFtp}>
                <Server className="mr-2 h-4 w-4" />
                Refresh FTP
              </Button>
            ) : (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6">
          <div className="grid gap-6">
            <EditSupplierForm supplier={supplier} onUpdate={fetchSupplier} />
            
            <FieldMappingCard supplier={supplier} />

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Products</h2>
              <DataTable 
                columns={getSupplierProductColumns()} 
                data={products}
                sorting={sorting}
                setSorting={setSorting}
                globalFilter=""
                setGlobalFilter={() => {}}
                pagination={pagination}
                setPagination={setPagination}
                pageCount={Math.ceil(totalRows / pagination.pageSize)}
                isLoading={isLoading}
                skeleton={<ProductsTableSkeleton />}
              />
            </div>

            <SupplierImports
              imports={imports}
              sorting={importsSorting}
              setSorting={setImportsSorting}
              dateRange={dateRange}
              setDateRange={setDateRange}
              pagination={importsPagination}
              setPagination={setImportsPagination}
              pageCount={Math.ceil(totalImports / importsPagination.pageSize)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      <UploadProductsDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        supplier={supplier}
        onSuccess={() => {
          fetchProducts();
          fetchImports();
        }}
      />
    </div>
  );
}