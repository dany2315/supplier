"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package2, Users, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    totalProducts: 0,
    totalImports: 0,
    activeSuppliers: 0,
  });
  const [importStats, setImportStats] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user.id) {
      router.push('/auth/login');
      return;
    }
    fetchDashboardData();
  }, [session, router]);

  async function fetchDashboardData() {
    if (!session?.user.id) return;
    
    try {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, is_active')

      if (suppliersError) throw suppliersError;

      const supplierIds = suppliersData?.map(s => s.id) || [];
      const totalSuppliers = suppliersData?.length || 0;
      const activeSuppliers = suppliersData?.filter(s => s.is_active)?.length || 0;

      // Get products count for user's suppliers
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .in('supplier_id', supplierIds);

      if (productsError) throw productsError;

      // Get imports count and stats for user's suppliers
      const { data: importsData, error: importsError } = await supabase
        .from('import_logs')
        .select('*')
        .in('supplier_id', supplierIds)
        .gte('created_at', subDays(new Date(), 7).toISOString())
        .order('created_at', { ascending: true });

      if (importsError) throw importsError;

      const totalImports = importsData?.length || 0;

      // Process import stats by day
      const importsByDay = {};
      importsData?.forEach(imp => {
        const day = format(new Date(imp.created_at), 'dd/MM');
        if (!importsByDay[day]) {
          importsByDay[day] = { successful: 0, failed: 0 };
        }
        if (imp.status === 'completed') {
          importsByDay[day].successful++;
        } else if (imp.status === 'failed') {
          importsByDay[day].failed++;
        }
      });

      // Fill in missing days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const day = format(date, 'dd/MM');
        if (!importsByDay[day]) {
          importsByDay[day] = { successful: 0, failed: 0 };
        }
      }

      // Convert to array and sort by date
      const chartData = Object.entries(importsByDay)
        .map(([date, stats]) => ({
          name: date,
          successful: stats.successful,
          failed: stats.failed,
        }))
        .sort((a, b) => {
          const [dayA, monthA] = a.name.split('/').map(Number);
          const [dayB, monthB] = b.name.split('/').map(Number);
          return monthA === monthB ? dayA - dayB : monthA - monthB;
        });

      // Get product distribution by supplier using a simpler query
      const { data: productsBySupplier, error: distributionError } = await supabase
        .from('suppliers')
        .select(`
          id,
          name,
          products:products(count)
        `)
        .in('id', supplierIds);

      if (distributionError) throw distributionError;

      const productDistribution = productsBySupplier
        ?.map(supplier => ({
          name: supplier.name,
          value: supplier.products.length,
        }))
        .filter(item => item.value > 0) || [];

      setStats({
        totalSuppliers,
        activeSuppliers,
        totalProducts: productsCount || 0,
        totalImports,
      });
      setImportStats(chartData);
      setProductStats(productDistribution);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!session) {
    return null;
  }

  return (
    <div className="py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your supplier management dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeSuppliers} active suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package2 className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Imports</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImports}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Data imports processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalImports > 0
                ? Math.round(
                    (importStats.reduce(
                      (acc, curr) => acc + curr.successful,
                      0
                    ) /
                      stats.totalImports) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Import success rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Import Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Overview data={importStats} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <SupplierDistribution data={productStats} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Overview({ data }) {
  return (
    <div className="h-[300px] w-full">
      <div className="space-y-4">
        {data.map((day) => (
          <div key={day.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div>{day.name}</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span>{day.successful}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span>{day.failed}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div 
                className="h-2 rounded-full bg-secondary transition-all duration-500" 
                style={{ 
                  width: `${(day.successful / (day.successful + day.failed || 1)) * 100}%` 
                }} 
              />
              <div 
                className="h-2 rounded-full bg-primary transition-all duration-500" 
                style={{ 
                  width: `${(day.failed / (day.successful + day.failed || 1)) * 100}%` 
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupplierDistribution({ data }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  
  return (
    <div className="h-[300px] w-full space-y-4">
      {data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-muted'];
        
        return (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${colors[index % colors.length]}`} />
                <span>{item.name}</span>
              </div>
              <div>{Math.round(percentage)}%</div>
            </div>
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${colors[index % colors.length]}`} 
              style={{ width: `${percentage}%` }} 
            />
          </div>
        );
      })}
    </div>
  );
}