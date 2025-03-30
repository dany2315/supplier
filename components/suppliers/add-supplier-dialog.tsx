"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Upload, Server, ArrowRight, ArrowLeft, FileText } from "lucide-react";
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { FieldMapping } from "./field-mapping";

const basicInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  contact_email: z.string().email("Invalid email address"),
  upload_method: z.enum(["manual", "ftp"], {
    required_error: "Please select an upload method",
  }),
  ftp_host: z.string().optional(),
  ftp_username: z.string().optional(),
  ftp_password: z.string().optional(),
  ftp_path: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.upload_method === "ftp") {
    if (!data.ftp_host) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FTP host is required",
        path: ["ftp_host"],
      });
    }
    if (!data.ftp_username) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FTP username is required",
        path: ["ftp_username"],
      });
    }
    if (!data.ftp_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FTP password is required",
        path: ["ftp_password"],
      });
    }
    if (!data.ftp_path) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File path is required",
        path: ["ftp_path"],
      });
    }
  }
});

type Step = "basic-info" | "field-mapping" | "review";

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierAdded: () => void;
  initialStep?: Step;
  editMode?: {
    supplier: {
      id: string;
      name: string;
      contact_email: string;
      ftp_host: string | null;
      ftp_username: string | null;
      ftp_password: string | null;
      ftp_path: string | null;
    };
    mappingOnly?: boolean;
  };
}

function cleanCSVValue(value: string): string {
  // Remove BOM if present
  value = value.replace(/^\uFEFF/, '');
  
  // Trim whitespace
  value = value.trim();
  
  // Remove multiple spaces
  value = value.replace(/\s+/g, ' ');
  
  // Remove special characters that could cause issues
  value = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  return value;
}

function validateNumber(value: string): number | null {
  // Remove any non-numeric characters except decimal point and minus sign
  const cleaned = value.replace(/[^\d.-]/g, '');
  const number = parseFloat(cleaned);
  
  // Check if it's a valid number and not NaN
  if (!isNaN(number) && isFinite(number)) {
    return number;
  }
  
  return null;
}

export function AddSupplierDialog({
  open,
  onOpenChange,
  onSupplierAdded,
  initialStep = "basic-info",
  editMode,
}: AddSupplierDialogProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy', // Skip empty lines and lines with only whitespace
        transform: (value) => cleanCSVValue(value),
        complete: (results) => {
          if (results.data && Array.isArray(results.data) && results.data.length > 0) {
            // Filter out rows where all values are empty or whitespace
            const validData = results.data.filter((row: any) => 
              Object.values(row).some(value => 
                value && value.toString().trim().length > 0
              )
            );

            if (validData.length > 0) {
              const headers = Object.keys(validData[0]);
              setSampleColumns(headers);
              setSampleData(validData);
            } else {
              toast({
                title: "Error",
                description: "The CSV file contains no valid data",
                variant: "destructive",
              });
            }
          }
        },
        error: (error) => {
          toast({
            title: "Error",
            description: `Failed to parse CSV file: ${error.message}`,
            variant: "destructive",
          });
        }
      });
      setCsvFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: "",
      contact_email: "",
      upload_method: "manual",
      ftp_host: "",
      ftp_username: "",
      ftp_password: "",
      ftp_path: "",
    },
  });

  useEffect(() => {
    if (editMode?.supplier) {
      basicInfoForm.reset({
        name: editMode.supplier.name,
        contact_email: editMode.supplier.contact_email,
        upload_method: editMode.supplier.ftp_host ? "ftp" : "manual",
        ftp_host: editMode.supplier.ftp_host || "",
        ftp_username: editMode.supplier.ftp_username || "",
        ftp_password: editMode.supplier.ftp_password || "",
        ftp_path: editMode.supplier.ftp_path || "",
      });
    }
  }, [editMode?.supplier]);

  const uploadMethod = basicInfoForm.watch("upload_method");

  const handleNext = async () => {
    if (step === "basic-info") {
      const valid = await basicInfoForm.trigger();
      if (!valid) return;

      if (uploadMethod === "manual" && !csvFile) {
        toast({
          title: "Error",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }

      setStep("field-mapping");
    } else if (step === "field-mapping") {
      if (!fieldMappings.sku || !fieldMappings.name || !fieldMappings.price_ht || !fieldMappings.stock) {
        toast({
          title: "Error",
          description: "Please map all required fields",
          variant: "destructive",
        });
        return;
      }

      // Validate mapped data
      const hasInvalidData = sampleData.some(row => {
        const sku = cleanCSVValue(row[fieldMappings.sku] || '');
        const name = cleanCSVValue(row[fieldMappings.name] || '');
        const price = validateNumber(row[fieldMappings.price_ht] || '');
        const stock = validateNumber(row[fieldMappings.stock] || '');

        return !sku || !name || price === null || stock === null || price < 0 || stock < 0;
      });

      if (hasInvalidData) {
        toast({
          title: "Warning",
          description: "Some rows contain invalid data. They will be skipped during import.",
          variant: "default",
        });
      }

      setStep("review");
    }
  };

  const handleBack = () => {
    if (step === "field-mapping") {
      setStep("basic-info");
    } else if (step === "review") {
      setStep("field-mapping");
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setStep("basic-info");
      basicInfoForm.reset();
      setCsvFile(null);
      setSampleColumns([]);
      setSampleData([]);
      setFieldMappings({});
      onOpenChange(false);
    }
  };

  const handleFieldMapping = (mappings: Record<string, string>) => {
    setFieldMappings(mappings);
  };

  async function onSubmit() {
    setIsLoading(true);
    setProgress(0);
    try {
      const basicInfo = basicInfoForm.getValues();
      let supplier;

      if (!editMode?.mappingOnly) {
        setCurrentOperation("Creating supplier...");
        setProgress(10);
        const { data: supplierData, error: supplierError } = await supabase
          .from("suppliers")
          .insert([{
            name: basicInfo.name,
            contact_email: basicInfo.contact_email,
            is_active: true,
            ...(basicInfo.upload_method === "ftp" && {
              ftp_host: basicInfo.ftp_host,
              ftp_username: basicInfo.ftp_username,
              ftp_password: basicInfo.ftp_password,
              ftp_path: basicInfo.ftp_path,
            }),
          }])
          .select()
          .single();

        if (supplierError) throw supplierError;
        supplier = supplierData;
        setProgress(30);
      }

      const supplierId = editMode?.supplier?.id || supplier.id;

      setCurrentOperation("Setting up field mappings...");
      const { error: mappingError } = await supabase
        .from("field_mappings")
        .insert(Object.entries(fieldMappings).map(([target, source]) => ({
          supplier_id: supplierId,
          source_column: source,
          target_field: target,
        })));

      if (mappingError) throw mappingError;
      setProgress(50);

      if (sampleData.length > 0) {
        setCurrentOperation("Processing and validating data...");
        const validData = sampleData.filter(row => {
          const sku = cleanCSVValue(row[fieldMappings.sku] || '');
          const name = cleanCSVValue(row[fieldMappings.name] || '');
          const price = validateNumber(row[fieldMappings.price_ht] || '');
          const stock = validateNumber(row[fieldMappings.stock] || '');

          return sku && name && price !== null && stock !== null && price >= 0 && stock >= 0;
        });

        setCurrentOperation("Importing products...");
        const batchSize = 100;
        const totalBatches = Math.ceil(validData.length / batchSize);
        let processedBatches = 0;

        for (let i = 0; i < validData.length; i += batchSize) {
          const batch = validData.slice(i, i + batchSize).map(row => ({
            supplier_id: supplierId,
            sku: cleanCSVValue(row[fieldMappings.sku]),
            name: cleanCSVValue(row[fieldMappings.name]),
            price_ht: validateNumber(row[fieldMappings.price_ht]) || 0,
            stock: validateNumber(row[fieldMappings.stock]) || 0,
          }));

          const { error: productsError } = await supabase
            .from("products")
            .insert(batch);

          if (productsError) throw productsError;

          processedBatches++;
          const progressValue = 50 + (processedBatches / totalBatches) * 50;
          setProgress(Math.round(progressValue));
        }

        const skippedRows = sampleData.length - validData.length;
        if (skippedRows > 0) {
          toast({
            title: "Import Complete",
            description: `${skippedRows} rows were skipped due to invalid data`,
            variant: "default",
          });
        }
      }

      setProgress(100);
      setCurrentOperation("Completed successfully!");
      toast({
        title: "Success",
        description: editMode?.mappingOnly 
          ? "Field mappings and products updated successfully"
          : `Supplier and products added successfully`,
      });

      handleClose();
      onSupplierAdded();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setProgress(0);
      setCurrentOperation("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        {isLoading && step === "review" && (
          <div className="absolute inset-x-0 top-0 p-6 bg-background/80 backdrop-blur-sm border-b">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{currentOperation}</p>
                <p className="text-sm text-muted-foreground">{progress}%</p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle>
            {editMode?.mappingOnly ? "Update Field Mappings" : "Add New Supplier"}
          </DialogTitle>
          <DialogDescription>
            {step === "basic-info" && "Enter the supplier's details and choose their preferred upload method."}
            {step === "field-mapping" && "Map the columns from your CSV file to our system fields."}
            {step === "review" && "Review your configuration before saving."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 overflow-y-auto flex-1">
          <Tabs value={step} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic-info" disabled>
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="field-mapping" disabled>
                Field Mapping
              </TabsTrigger>
              <TabsTrigger value="review" disabled>
                Review
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info">
              <Form {...basicInfoForm}>
                <form className="space-y-4 mt-4">
                  <FormField
                    control={basicInfoForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Supplier name" 
                            {...field} 
                            disabled={isLoading || editMode?.mappingOnly} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={basicInfoForm.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="contact@supplier.com" 
                            {...field} 
                            disabled={isLoading || editMode?.mappingOnly} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={basicInfoForm.control}
                    name="upload_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload Method</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "ftp") {
                              setCsvFile(null);
                              setSampleColumns([]);
                              setSampleData([]);
                            }
                          }}
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select upload method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manual">
                              <div className="flex items-center">
                                <Upload className="w-4 h-4 mr-2" />
                                <span>Manual Upload</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="ftp">
                              <div className="flex items-center">
                                <Server className="w-4 h-4 mr-2" />
                                <span>FTP Server</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose how this supplier will provide their product data
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {uploadMethod === "manual" && (
                    <div className="mt-4">
                      <FormLabel className="flex items-center">
                        Sample CSV File
                        <span className="text-destructive ml-1">*</span>
                      </FormLabel>
                      <div
                        {...getRootProps()}
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                          isDragActive
                            ? "border-primary bg-primary/5"
                            : csvFile 
                              ? "border-primary" 
                              : "border-border hover:border-primary/50"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                          {csvFile ? (
                            <div>
                              <p className="font-medium">{csvFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Click or drag to replace
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">
                                Drop your CSV file here or click to select
                              </p>
                              <p className="text-sm text-muted-foreground">
                                The file should contain product data with headers
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {uploadMethod === "ftp" && (
                    <>
                      <FormField
                        control={basicInfoForm.control}
                        name="ftp_host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              FTP Host
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ftp.supplier.com" 
                                {...field} 
                                disabled={isLoading || editMode?.mappingOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={basicInfoForm.control}
                        name="ftp_username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              FTP Username
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="username" 
                                {...field} 
                                disabled={isLoading || editMode?.mappingOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={basicInfoForm.control}
                        name="ftp_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              FTP Password
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                                disabled={isLoading || editMode?.mappingOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={basicInfoForm.control}
                        name="ftp_path"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              File Path
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="/path/to/inventory.csv"
                                {...field}
                                disabled={isLoading || editMode?.mappingOnly}
                              />
                            </FormControl>
                            <FormDescription>
                              Full path to the inventory file on the FTP server
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="field-mapping">
              <div className="space-y-6">
                <FieldMapping
                  availableColumns={sampleColumns}
                  sampleData={sampleData}
                  onMapping={handleFieldMapping}
                />
              </div>
            </TabsContent>

            <TabsContent value="review">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium">Basic Information</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">Name:</span> {basicInfoForm.getValues().name}</p>
                    <p><span className="font-medium">Email:</span> {basicInfoForm.getValues().contact_email}</p>
                    <p><span className="font-medium">Upload Method:</span> {basicInfoForm.getValues().upload_method}</p>
                    {basicInfoForm.getValues().upload_method === "ftp" ? (
                      <>
                        <p><span className="font-medium">FTP Host:</span> {basicInfoForm.getValues().ftp_host}</p>
                        <p><span className="font-medium">FTP Path:</span> {basicInfoForm.getValues().ftp_path}</p>
                      </>
                    ) : (
                      <p><span className="font-medium">Sample File:</span> {csvFile?.name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Field Mapping</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p><span className="font-medium">SKU:</span> {fieldMappings.sku}</p>
                    <p><span className="font-medium">Name:</span> {fieldMappings.name}</p>
                    <p><span className="font-medium">Price:</span> {fieldMappings.price_ht}</p>
                    <p><span className="font-medium">Stock:</span> {fieldMappings.stock}</p>
                  </div>
                </div>

                {sampleData.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Sample Products Preview</h3>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">SKU</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Price HT</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">Stock</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {sampleData.slice(0, 3).map((row, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm">{row[fieldMappings.sku]}</td>
                              <td className="px-4 py-2 text-sm">{row[fieldMappings.name]}</td>
                              <td className="px-4 py-2 text-sm">{row[fieldMappings.price_ht]}</td>
                              <td className="px-4 py-2 text-sm">{row[fieldMappings.stock]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between mt-6">
          <div>
            {step !== "basic-info" && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {step !== "review" ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : editMode?.mappingOnly ? "Update" : "Create Supplier"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}