import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, User, LogOut, RotateCcw } from 'lucide-react';
import { StoreProvider } from '@/contexts/StoreContext';
import { StoreHeader } from '@/components/store/StoreHeader';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { OrderStatus } from '@/types/database';

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: 'Yangi', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Tayyorlanmoqda', color: 'bg-yellow-100 text-yellow-700' },
  ready: { label: 'Tayyor', color: 'bg-green-100 text-green-700' },
  delivered: { label: 'Yetkazildi', color: 'bg-emerald-100 text-emerald-700' },
  canceled: { label: 'Bekor qilindi', color: 'bg-red-100 text-red-700' },
};

function StoreAccountContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { customer, signOut, isLoading: authLoading } = useCustomerAuth();

  useEffect(() => {
    if (!authLoading && !customer) {
      navigate(`/store/${slug}/login`);
    }
  }, [customer, authLoading, navigate, slug]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders', customer?.id],
    queryFn: async () => {
      const token = localStorage.getItem('xoztovars-customer-token');
      if (!token) return [];
      const { data } = await supabase.rpc('customer_get_orders', { p_token: token });
      return (data as any[]) || [];
    },
    enabled: !!customer,
  });

  const { addItem } = useCartStore();

  const handleSignOut = async () => {
    await signOut();
    navigate(`/store/${slug}`);
  };

  const handleRepeatOrder = async (orderId: string) => {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, product_name_snapshot, quantity, unit_price')
      .eq('order_id', orderId);

    if (!items || items.length === 0) return;

    for (const item of items) {
      addItem({
        productId: item.product_id,
        name: item.product_name_snapshot,
        price: item.unit_price,
        quantity: item.quantity,
        stepQty: 1,
        minOrderQty: 1,
        stockQty: 999,
      });
    }
    toast.success('Mahsulotlar savatga qo\'shildi!');
    navigate(`/store/${slug}/cart`);
  };

  if (authLoading || !customer) return null;

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link to={`/store/${slug}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" />
            Do'konga qaytish
          </Link>

          {/* Profile */}
          <div className="bg-card rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold">{customer.first_name} {customer.last_name}</h1>
                <p className="text-muted-foreground text-sm">{customer.phone}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-destructive hover:text-destructive gap-2">
              <LogOut className="w-4 h-4" />
              Chiqish
            </Button>
          </div>

          {/* Orders */}
          <div>
            <h2 className="font-display font-bold text-lg mb-4">Buyurtmalar tarixi</h2>

            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card rounded-2xl p-4 h-20 animate-pulse" />
                ))}
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-3">
                {orders.map((order: any) => {
                  const cfg = statusConfig[order.status as OrderStatus];
                  return (
                    <div key={order.id} className="bg-card rounded-2xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <Link to={`/store/${order.store_slug}/order/${order.order_number}`} className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{order.order_number}</span>
                            <span className="text-xs text-muted-foreground">{order.store_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('uz-UZ')}
                          </p>
                        </Link>
                        <div className="text-right flex flex-col items-end gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg?.color || ''}`}>
                            {cfg?.label || order.status}
                          </span>
                          <p className="font-bold text-primary">{formatPrice(order.total_amount)}</p>
                          <Button
                            size="sm" variant="outline"
                            className="gap-1.5 text-xs h-7"
                            onClick={() => handleRepeatOrder(order.id)}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Qayta buyurtma
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Hali buyurtma yo'q</p>
                <Link to={`/store/${slug}`}>
                  <Button className="mt-4" variant="outline">Xarid qilish</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StoreAccount() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider storeSlug={slug}>
      <StoreAccountContent />
    </StoreProvider>
  );
}
