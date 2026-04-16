import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, DollarSign, TrendingUp, Clock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { Order, OrderStatus } from '@/types/database';
import { cn } from '@/lib/utils';

const statusColors: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  canceled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<OrderStatus, string> = {
  new: 'Yangi',
  processing: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  delivered: 'Yetkazildi',
  canceled: 'Bekor qilindi',
};

export default function AdminDashboard() {
  const { userStore } = useAuth();
  const storeId = userStore?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats', storeId],
    queryFn: async () => {
      let ordersQuery = supabase.from('orders').select('*', { count: 'exact', head: true });
      let newOrdersQuery = supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new');
      let productsQuery = supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
      let revenueQuery = supabase.from('orders').select('total_amount').in('status', ['delivered', 'ready', 'processing']);
      let customersQuery = supabase.from('orders').select('customer_phone');

      if (storeId) {
        ordersQuery = ordersQuery.eq('store_id', storeId);
        newOrdersQuery = newOrdersQuery.eq('store_id', storeId);
        productsQuery = productsQuery.eq('store_id', storeId);
        revenueQuery = revenueQuery.eq('store_id', storeId);
        customersQuery = customersQuery.eq('store_id', storeId);
      }

      const [{ count: totalOrders }, { count: newOrders }, { count: totalProducts }, { data: orders }, { data: customerRows }] =
        await Promise.all([ordersQuery, newOrdersQuery, productsQuery, revenueQuery, customersQuery]);

      const totalRevenue = orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0;
      const uniqueCustomers = new Set(customerRows?.map(r => r.customer_phone)).size;

      return { totalOrders: totalOrders || 0, newOrders: newOrders || 0, totalProducts: totalProducts || 0, totalRevenue, uniqueCustomers };
    },
    enabled: !!storeId,
  });

  const { data: chartData } = useQuery({
    queryKey: ['admin-chart', storeId],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('store_id', storeId!)
        .gte('created_at', since.toISOString());

      const days: Record<string, { day: string; savdo: number; buyurtma: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
        days[key] = { day: key, savdo: 0, buyurtma: 0 };
      }
      for (const o of data || []) {
        const key = new Date(o.created_at).toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
        if (days[key]) { days[key].savdo += o.total_amount; days[key].buyurtma += 1; }
      }
      return Object.values(days);
    },
    enabled: !!storeId,
  });

  const { data: topProducts } = useQuery({
    queryKey: ['admin-top-products', storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_items')
        .select('product_name_snapshot, quantity')
        .eq('orders.store_id', storeId!);

      // Group by product name
      const map = new Map<string, number>();
      for (const item of data || []) {
        map.set(item.product_name_snapshot, (map.get(item.product_name_snapshot) || 0) + item.quantity);
      }
      return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, count }));
    },
    enabled: !!storeId,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-recent-orders', storeId],
    queryFn: async () => {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(7);
      if (storeId) query = query.eq('store_id', storeId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!storeId,
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ['admin-low-stock', storeId],
    queryFn: async () => {
      let query = supabase.from('products').select('id, name, stock_qty, unit').eq('is_active', true).lte('stock_qty', 5).order('stock_qty', { ascending: true }).limit(5);
      if (storeId) query = query.eq('store_id', storeId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  const statCards = [
    { title: 'Yangi buyurtmalar', value: stats?.newOrders || 0, icon: ShoppingCart, color: 'bg-blue-500' },
    { title: 'Jami buyurtmalar', value: stats?.totalOrders || 0, icon: Package, color: 'bg-purple-500' },
    { title: 'Mijozlar', value: stats?.uniqueCustomers || 0, icon: Users, color: 'bg-green-500' },
    { title: 'Daromad', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, color: 'bg-amber-500', isPrice: true },
  ];

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Hozirgina';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} soat oldin`;
    return date.toLocaleDateString('uz-UZ');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          : statCards.map((stat) => (
              <div key={stat.title} className="bg-card rounded-2xl p-6 flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.isPrice ? stat.value : stat.value.toLocaleString()}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Sales chart */}
        <div className="md:col-span-2 bg-card rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">So'nggi 7 kunlik savdo</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="colorSavdo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: number) => [formatPrice(v), 'Savdo']} />
              <Area type="monotone" dataKey="savdo" stroke="hsl(var(--primary))" fill="url(#colorSavdo)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-card rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">Ko'p sotilganlar</h2>
          {topProducts && topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip formatter={(v: number) => [v + ' dona', 'Sotilgan']} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Ma'lumot yo'q</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="md:col-span-2 bg-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">So'nggi buyurtmalar</h2>
            <Link to="/dashboard/orders"><Button variant="ghost" size="sm">Barchasi</Button></Link>
          </div>
          {ordersLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : recentOrders?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Buyurtmalar yo'q</p>
          ) : (
            <div className="space-y-2">
              {recentOrders?.map((order) => (
                <Link key={order.id} to={`/dashboard/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">{order.order_number}</span>
                      <Badge className={cn('text-[10px] border-0', statusColors[order.status])}>{statusLabels[order.status]}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{order.customer_name} • {order.customer_phone}</div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-semibold text-sm">{formatPrice(order.total_amount)}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />{formatTime(order.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-card rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-4">Kam qolgan mahsulotlar</h2>
          {lowStockProducts?.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">Hammasi yetarli</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts?.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <span className="text-sm truncate mr-2">{p.name}</span>
                  <Badge variant={p.stock_qty <= 0 ? 'destructive' : 'secondary'} className="shrink-0">{p.stock_qty} {p.unit}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
