"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export type Import = {
  id: string;
  supplier: {
    name: string;
  };
  file_name: string;
  status: string;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  error_details: any;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

// Base columns without supplier
const baseColumns: ColumnDef<Import>[] = [
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => format(new Date(row.getValue("created_at")), "dd/MM/yyyy HH:mm"),
  },
  {
    accessorKey: "file_name",
    header: "File",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      let variant: "default" | "secondary" | "destructive" = "default";
      
      switch (status) {
        case "completed":
          variant = "default";
          break;
        case "processing":
          variant = "secondary";
          break;
        case "failed":
          variant = "destructive";
          break;
      }
      
      return (
        <Badge variant={variant}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    id: "results",
    header: "Results",
    cell: ({ row }) => {
      const import_log = row.original;
      if (import_log.status === "failed") {
        return (
          <span className="text-destructive">
            {import_log.error_details?.message || "Import failed"}
          </span>
        );
      }
      return (
        <span>
          {import_log.imported_rows} imported
          {import_log.skipped_rows > 0 && ` (${import_log.skipped_rows} skipped)`}
        </span>
      );
    },
  },
  {
    accessorKey: "completed_at",
    header: "Duration",
    cell: ({ row }) => {
      const started = new Date(row.original.started_at);
      const completed = row.original.completed_at 
        ? new Date(row.original.completed_at)
        : row.original.status === "processing" 
          ? new Date() 
          : started;
      
      const duration = Math.round((completed.getTime() - started.getTime()) / 1000);
      
      if (row.original.status === "processing") {
        return `${duration}s (in progress)`;
      }
      
      return `${duration}s`;
    },
  },
];

// Supplier column definition
const supplierColumn: ColumnDef<Import> = {
  id: "supplier",
  accessorFn: (row) => row.supplier?.name,
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Supplier
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  },
};

// Export columns with supplier (for main imports page)
export const columns: ColumnDef<Import>[] = [
  baseColumns[0],
  supplierColumn,
  ...baseColumns.slice(1),
];

// Export columns without supplier (for supplier detail page)
export const getSupplierImportColumns = (): ColumnDef<Import>[] => baseColumns;