import { supabase } from '@/lib/supabase';

async function seedData() {
  // Insert suppliers
  const { data: suppliersData, error: suppliersError } = await supabase
    .from('suppliers')
    .insert([
      {
        name: 'TechSupply Corp',
        contact_email: 'contact@techsupply.com',
        is_active: true,
      },
      {
        name: 'Global Electronics',
        contact_email: 'sales@globalelectronics.com',
        is_active: true,
        ftp_host: 'ftp.globalelectronics.com',
        ftp_username: 'global_ftp',
        ftp_password: 'secure_password',
        ftp_path: '/exports/inventory.csv',
      },
    ])
    .select();

  if (suppliersError) {
    console.error('Error seeding suppliers:', suppliersError);
    return;
  }

  // Insert products
  if (suppliersData) {
    const productsToInsert = suppliersData.flatMap(supplier => [
      {
        sku: 'LAP-001',
        name: 'ThinkPad X1 Carbon',
        supplier_id: supplier.id,
        stock: Math.floor(Math.random() * 100),
        price_ht: 1299.99,
      },
      {
        sku: `${supplier.name.substring(0, 3).toUpperCase()}-MON-001`,
        name: 'Dell UltraSharp 27"',
        supplier_id: supplier.id,
        stock: Math.floor(Math.random() * 100),
        price_ht: 449.99,
      },
      {
        sku: `${supplier.name.substring(0, 3).toUpperCase()}-KEY-001`,
        name: 'Logitech MX Keys',
        supplier_id: supplier.id,
        stock: Math.floor(Math.random() * 100),
        price_ht: 99.99,
      },
    ]);

    const { error: productsError } = await supabase
      .from('products')
      .insert(productsToInsert);

    if (productsError) {
      console.error('Error seeding products:', productsError);
      return;
    }
  }

  console.log('Sample data seeded successfully!');
}

seedData();