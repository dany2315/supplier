"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/components/imports/data-table';
import { columns } from '@/components/imports/columns';
import { ImportsTableSkeleton } from '@/components/imports/imports-table-skeleton';
import { ImportDetailsDialog } from '@/components/imports/import-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { SortingState } from '@tanstack/react-table';
import { Import } from '@/components/imports/columns';
import { subDays } from 'date-fns';

export default function ImportsPage() {
  const [imports, setImports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [selectedImport, setSelectedImport] = useState<Import | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchImports();
  }, [sorting, dateRange, pagination.pageIndex, pagination.pageSize]);

  async function fetchImports() {
    try {
      let query = supabase
        .from('import_logs')
        .select(`
          *,
          supplier:suppliers(name)
        `, { count: 'exact' });

      // Apply date range filter
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
  
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
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

      if (error) throw error;

      setImports(data || []);
      setTotalRows(count || 0);
    } catch (error) {
      console.error('Error fetching imports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch imports. Please try again.",
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
        <h1 className="text-3xl font-bold flex-1">Import History</h1>
      </div>

      <DataTable 
        columns={columns}
        data={imports}
        sorting={sorting}
        setSorting={setSorting}
        dateRange={dateRange}
        setDateRange={setDateRange}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={Math.ceil(totalRows / pagination.pageSize)}
        isLoading={isLoading}
        skeleton={<ImportsTableSkeleton />}
        onRowClick={setSelectedImport}
      />

      <ImportDetailsDialog
        open={!!selectedImport}
        onOpenChange={(open) => !open && setSelectedImport(null)}
        import_log={selectedImport}
      />
    </div>
  );
}