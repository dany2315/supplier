"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/imports/data-table";
import { getSupplierImportColumns } from "@/components/imports/columns";
import { ImportDetailsDialog } from "@/components/imports/import-details-dialog";
import { Import } from "@/components/imports/columns";
import { flexRender } from "@tanstack/react-table";

interface SupplierImportsProps {
  imports: Import[];
  sorting: any;
  setSorting: (sorting: any) => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  setPagination: (pagination: any) => void;
  pageCount: number;
  isLoading: boolean;
}

export function SupplierImports({
  imports,
  sorting,
  setSorting,
  dateRange,
  setDateRange,
  pagination,
  setPagination,
  pageCount,
  isLoading,
}: SupplierImportsProps) {
  const [selectedImport, setSelectedImport] = useState<Import | null>(null);

  // Add click handler to the columns
  const columnsWithClick = getSupplierImportColumns().map(col => ({
    ...col,
    cell: (props: any) => (
      <div
        onClick={() => setSelectedImport(props.row.original)}
        className="cursor-pointer hover:text-primary transition-colors"
      >
        {col.cell ? col.cell(props) : flexRender(col.accessorKey, props)}
      </div>
    ),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import History</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columnsWithClick}
          data={imports}
          sorting={sorting}
          setSorting={setSorting}
          dateRange={dateRange}
          setDateRange={setDateRange}
          pagination={pagination}
          setPagination={setPagination}
          pageCount={pageCount}
          isLoading={isLoading}
        />

        <ImportDetailsDialog
          open={!!selectedImport}
          onOpenChange={(open) => !open && setSelectedImport(null)}
          import_log={selectedImport}
        />
      </CardContent>
    </Card>
  );
}