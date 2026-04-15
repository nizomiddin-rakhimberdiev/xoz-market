import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Package, Truck, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StoreProvider } from '@/contexts/StoreContext';
import { StoreHeader } from '@/components/store/StoreHeader';
import { formatPrice } from '@/lib/api';
import type { OrderStatus } from '@/types/database';

const statusConfig: Record<OrderStatus, { label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  new: { label: 'Yangi buyurtma', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  processing: { label: 'Tayyorlanmoqda', icon: Package, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ready: { label: 'Tayyor, yetkazilishini kutmoqda', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  delivered: { label: 'Yetkazildi', icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  canceled: { label: 'Bekor qilindi', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const steps: OrderStatus[] = ['new', 'processing', 'ready', 'delivered'];

function OrderStatusContent() {
  const { slug, orderNumber } = useParams<{ slug: string; orderNumber: string }>();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-status', orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', orderNumber!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orderNumber,
    refetchInterval: 30000, // 30 sekundda bir yangilanadi
  });

  const storeBase = `/store/${slug}`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <main className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center">
            <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Buyurtma topilmadi</h2>
            <p className="text-muted-foreground mb-6">Buyurtma raqamini tekshirib qayta urinib ko'ring.</p>
            <Link to={storeBase} className="text-primary hover:underline flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Do'konga qaytish
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const config = statusConfig[order.status as OrderStatus];
  const Icon = config.icon;
  const isCanceled = order.status === 'canceled';
  const currentStepIndex = steps.indexOf(order.status as OrderStatus);

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto space-y-6">
          <Link to={storeBase} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <ArrowLeft className="w-4 h-4" />
            Do'konga qaytish
          </Link>

          {/* Status card */}
          <div className={`rounded-2xl p-6 text-center ${config.bg}`}>
            <Icon className={`w-16 h-16 mx-auto mb-4 ${config.color}`} />
            <h1 className={`text-2xl font-display font-bold mb-1 ${config.color}`}>{config.label}</h1>
            <p className="text-muted-foreground text-sm">Buyurtma #{order.order_number}</p>
          </div>

          {/* Progress steps */}
          {!isCanceled && (
            <div className="bg-card rounded-2xl p-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-border -z-0" />
                <div
                  className="absolute left-0 top-4 h-0.5 bg-primary transition-all duration-500 -z-0"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
                {steps.map((step, i) => {
                  const done = i <= currentStepIndex;
                  const StepIcon = statusConfig[step].icon;
                  return (
                    <div key={step} className="flex flex-col items-center gap-2 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'}`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs text-center hidden sm:block ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {statusConfig[step].label.split(',')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order details */}
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display font-bold">Buyurtma tarkibi</h2>
            <div className="space-y-2">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.product_name_snapshot} × {item.quantity}</span>
                  <span className="font-medium">{formatPrice(item.line_total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold">Jami:</span>
              <span className="font-bold text-primary text-lg">{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Sahifa har 30 sekundda avtomatik yangilanadi
          </p>
        </div>
      </main>
    </div>
  );
}

export default function StoreOrderStatus() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider storeSlug={slug}>
      <OrderStatusContent />
    </StoreProvider>
  );
}
