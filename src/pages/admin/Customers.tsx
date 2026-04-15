import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Phone, ShoppingBag, TrendingUp, Search, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/api';
import { Input } from '@/components/ui/input';

interface CustomerRow {
  phone: string;
  name: string;
  order_count: number;
  total_spent: number;
  last_order_at: string;
  is_registered: boolean;
}

export default function AdminCustomers() {
  const { userStore } = useAuth();
  const [search, setSearch] = useState('');

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers', userStore?.id],
    queryFn: async () => {
      // Buyurtmalardan noyob mijozlarni olib, customers jadvalidan ro'yxatdan o'tgan-o'tmaganligini tekshiramiz
      const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_name, customer_phone, total_amount, created_at')
        .eq('store_id', userStore!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Telefon bo'yicha guruhlash
      const map = new Map<string, CustomerRow>();
      for (const order of orders || []) {
        const phone = order.customer_phone;
        if (map.has(phone)) {
          const existing = map.get(phone)!;
          existing.order_count += 1;
          existing.total_spent += order.total_amount;
        } else {
          map.set(phone, {
            phone,
            name: order.customer_name,
            order_count: 1,
            total_spent: order.total_amount,
            last_order_at: order.created_at,
            is_registered: false,
          });
        }
      }

      // Ro'yxatdan o'tganlarni tekshirish
      const phones = Array.from(map.keys());
      if (phones.length > 0) {
        const { data: registered } = await supabase
          .from('customers')
          .select('phone')
          .in('phone', phones);

        for (const r of registered || []) {
          if (map.has(r.phone)) {
            map.get(r.phone)!.is_registered = true;
          }
        }
      }

      return Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent);
    },
    enabled: !!userStore,
  });

  const filtered = customers?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  ) || [];

  const totalCustomers = customers?.length || 0;
  const registeredCount = customers?.filter(c => c.is_registered).length || 0;
  const totalRevenue = customers?.reduce((sum, c) => sum + c.total_spent, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Mijozlar</h1>
        <p className="text-muted-foreground">Buyurtma bergan barcha mijozlar</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jami mijozlar</p>
            <p className="text-2xl font-bold">{totalCustomers}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ro'yxatdan o'tgan</p>
            <p className="text-2xl font-bold">{registeredCount}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Umumiy savdo</p>
            <p className="text-xl font-bold">{formatPrice(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? 'Qidiruv bo\'yicha hech narsa topilmadi' : 'Hali buyurtma yo\'q'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Mijoz</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Telefon</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Buyurtmalar</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Jami xarid</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Holat</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.phone} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium">{customer.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${customer.phone}`}
                        className="flex items-center gap-1.5 text-primary hover:underline text-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm">
                        <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                        {customer.order_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatPrice(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {customer.is_registered ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                          Ro'yxatdan o'tgan
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground font-medium">
                          Mehmon
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
