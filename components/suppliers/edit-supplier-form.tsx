"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact_email: z.string().email("Invalid email address"),
  is_active: z.boolean(),
  ftp_host: z.string().optional(),
  ftp_username: z.string().optional(),
  ftp_password: z.string().optional(),
  ftp_path: z.string().optional(),
});

interface EditSupplierFormProps {
  supplier: any;
  onUpdate: () => void;
}

export function EditSupplierForm({ supplier, onUpdate }: EditSupplierFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier.name,
      contact_email: supplier.contact_email || "",
      is_active: supplier.is_active,
      ftp_host: supplier.ftp_host || "",
      ftp_username: supplier.ftp_username || "",
      ftp_password: supplier.ftp_password || "",
      ftp_path: supplier.ftp_path || "",
    },
  });

  async function onSubmit(values: z.infer<typeof supplierSchema>) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("suppliers")
        .update(values)
        .eq("id", supplier.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Supplier updated successfully",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "Error",
        description: "Failed to update supplier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const isFtpSupplier = !!supplier.ftp_host;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier Details</CardTitle>
        <CardDescription>
          Update the supplier's information and settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Determine if this supplier is currently active
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isFtpSupplier && (
              <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">FTP Configuration</div>
                
                <FormField
                  control={form.control}
                  name="ftp_host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FTP Host</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ftp_username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FTP Username</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ftp_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FTP Password</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="password" 
                          disabled={isLoading}
                          placeholder="••••••••" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ftp_path"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Path</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}