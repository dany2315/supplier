"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown, Upload, Server, Trash2, RefreshCw, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export type Supplier = {
  id: string;
  name: string;
  contact_email: string | null;
  is_active: boolean;
  ftp_host: string | null;
  created_at: string;
};

interface SupplierColumnsProps {
  onDeleteClick: (supplier: Supplier) => void;
  onUploadClick: (supplier: Supplier) => void;
  onRefreshFtpClick: (supplier: Supplier) => void;
}

export const getColumns = ({ onDeleteClick, onUploadClick, onRefreshFtpClick }: SupplierColumnsProps): ColumnDef<Supplier>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/suppliers/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
      );
    },
  },
  {
    accessorKey: "contact_email",
    header: "Email",
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-sm ${
          row.original.is_active
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.is_active ? "Active" : "Inactive"}
      </span>
    ),
  },
  {
    id: "upload_method",
    header: "Upload Method",
    cell: ({ row }) => {
      const supplier = row.original;
      const isFtp = !!supplier.ftp_host;

      return (
        <div className="flex items-center gap-2">
          {isFtp ? (
            <>
              <div className="flex items-center text-blue-600">
                <Server className="h-4 w-4 mr-1" />
                <span>FTP</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onRefreshFtpClick(supplier)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center text-gray-600">
                <Upload className="h-4 w-4 mr-1" />
                <span>Manual</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onUploadClick(supplier)}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const supplier = row.original;
      const isFtp = !!supplier.ftp_host;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/suppliers/${supplier.id}`}>
                <Settings className="mr-2 h-4 w-4" />
                Manage Supplier
              </Link>
            </DropdownMenuItem>
            {!isFtp && (
              <DropdownMenuItem onClick={() => onUploadClick(supplier)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeleteClick(supplier)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Supplier
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];