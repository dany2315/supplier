"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DataTable } from '@/components/products/data-table';
import { columns } from '@/components/products/columns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductsTableSkeleton } from '@/components/products/products-table-skeleton';
import { useToast } from '@/hooks/use-toast';
import { SortingState } from '@tanstack/react-table';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [sorting, globalFilter, pagination.pageIndex, pagination.pageSize]);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          supplier:suppliers(name)
        `, { count: 'exact' });

      // Apply search filter if exists
      if (globalFilter) {
        query = query.or(`name.ilike.%${globalFilter}%,sku.ilike.%${globalFilter}%`);
      }

      // Apply sorting
      if (sorting.length > 0) {
        const { id, desc } = sorting[0];
        if (id === 'supplier') {
          query = query.order('supplier(name)', { ascending: !desc });
        } else {
          query = query.order(id, { ascending: !desc });
        }
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = pagination.pageIndex * pagination.pageSize;
      query = query.range(from, from + pagination.pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error",
          description: "Failed to fetch products. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setProducts(data || []);
      setTotalRows(count || 0);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-8">
        <Button variant="ghost" asChild className="mr-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex-1">Products</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <DataTable 
        columns={columns} 
        data={products}
        sorting={sorting}
        setSorting={setSorting}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={Math.ceil(totalRows / pagination.pageSize)}
        isLoading={isLoading}
        skeleton={<ProductsTableSkeleton />}
      />
    </div>
  );
}