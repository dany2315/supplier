"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EditMappingDialog } from "./edit-mapping-dialog";

interface FieldMappingCardProps {
  supplier: {
    id: string;
    name: string;
    contact_email: string;
    ftp_host: string | null;
  };
}

export function FieldMappingCard({ supplier }: FieldMappingCardProps) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMappings();
  }, [supplier.id]);

  async function fetchMappings() {
    try {
      const { data, error } = await supabase
        .from('field_mappings')
        .select('*')
        .eq('supplier_id', supplier.id)
        .order('target_field');

      if (error) throw error;

      setMappings(data || []);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch field mappings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle>Field Mappings</CardTitle>
            <CardDescription>
              Configure how CSV columns map to system fields
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowEditDialog(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Mappings
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              ))}
            </div>
          ) : mappings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System Field</TableHead>
                  <TableHead>CSV Column</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.target_field}
                    </TableCell>
                    <TableCell>{mapping.source_column}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No field mappings configured yet
            </div>
          )}
        </CardContent>
      </Card>

      <EditMappingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        supplier={supplier}
        onSuccess={fetchMappings}
      />
    </>
  );
}