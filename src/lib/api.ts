import { supabase } from '@/integrations/supabase/client';
import type { Category, Product, Order, CreateOrderInput, Store, CreateStoreInput } from '@/types/database';

// =============================================
// STORES
// =============================================

export async function getStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .eq('store_status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Store[];
}

export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data as Store | null;
}

export async function getMyStore(): Promise<Store | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as Store | null;
}

export async function createStore(input: CreateStoreInput): Promise<Store> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Avtorizatsiya talab qilinadi');

  const { data, error } = await supabase
    .from('stores')
    .insert({
      owner_id: user.id,
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      phone: input.phone || null,
      address: input.address || null,
      city: input.city || null,
      store_status: 'active',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Bu slug allaqachon band. Boshqa slug tanlang.');
    }
    throw error;
  }

  // store_owner rolini qo'shish
  await supabase.from('user_roles').upsert({
    user_id: user.id,
    role: 'store_owner',
  }, { onConflict: 'user_id,role' });

  return data as Store;
}

export async function updateStore(storeId: string, updates: Partial<Store>): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update(updates)
    .eq('id', storeId);

  if (error) throw error;
}

// =============================================
// CATEGORIES (store_id bilan)
// =============================================

export async function getCategories(storeId?: string): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// =============================================
// PRODUCTS (store_id bilan)
// =============================================

export async function getProducts(params?: {
  storeId?: string;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `, { count: 'exact' })
    .eq('is_active', true);

  if (params?.storeId) {
    query = query.eq('store_id', params.storeId);
  }

  if (params?.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }

  if (params?.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
  }

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) throw error;
  return { products: (data as Product[]) || [], total: count || 0 };
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Product;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*)
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Product;
}

// =============================================
// ORDERS (store_id bilan)
// =============================================

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data, error } = await supabase.rpc('create_order_rpc', {
    p_store_id: input.store_id,
    p_customer_name: input.customer_name,
    p_customer_phone: input.customer_phone,
    p_delivery_type: input.delivery_type,
    p_payment_type: input.payment_type,
    p_delivery_address: input.delivery_address_text || null,
    p_delivery_lat: input.delivery_lat || null,
    p_delivery_lng: input.delivery_lng || null,
    p_comment: input.comment || null,
    p_items: input.items.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id || '',
      quantity: item.quantity,
      product_name: item.product_name,
    })),
  });

  if (error) {
    throw new Error(error.message || 'Buyurtma yaratishda xatolik');
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Buyurtma yaratishda xatolik');
  }

  return data.order as Order;
}

// =============================================
// PLATFORM ADMIN
// =============================================

export async function getAllStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Store[];
}

export async function updateStoreStatus(storeId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({ store_status: status })
    .eq('id', storeId);

  if (error) throw error;
}

// =============================================
// UTILS
// =============================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' so\'m';
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
