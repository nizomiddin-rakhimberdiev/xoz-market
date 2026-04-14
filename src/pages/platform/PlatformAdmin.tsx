import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Store, ShieldCheck, Eye, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllStores, updateStoreStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import type { Store as StoreType } from '@/types/database';

const statusLabels: Record<string, string> = {
  active: 'Faol',
  inactive: 'Nofaol',
  suspended: 'To\'xtatilgan',
  pending: 'Kutilmoqda',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600',
  inactive: 'bg-gray-500/10 text-gray-600',
  suspended: 'bg-red-500/10 text-red-600',
  pending: 'bg-yellow-500/10 text-yellow-600',
};

export default function PlatformAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isPlatformAdmin, isLoading: authLoading, signOut } = useAuth();

  const { data: stores, isLoading } = useQuery({
    queryKey: ['all-stores'],
    queryFn: getAllStores,
    enabled: isPlatformAdmin,
  });

  const statusMutation = useMutation({
    mutationFn: ({ storeId, status }: { storeId: string; status: string }) =>
      updateStoreStatus(storeId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-stores'] });
      toast.success('Status yangilandi');
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Ruxsat yo'q</h1>
          <p className="text-muted-foreground">
            Bu sahifaga faqat platforma administratorlari kira oladi.
          </p>
          <Link to="/">
            <Button>Bosh sahifaga qaytish</Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeStores = stores?.filter(s => s.store_status === 'active').length || 0;
  const pendingStores = stores?.filter(s => s.store_status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            <span className="font-display text-xl font-bold">Platform Admin</span>
          </div>
          <Button variant="ghost" onClick={() => { signOut(); navigate('/login'); }}>
            Chiqish
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Jami do'konlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stores?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Faol do'konlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeStores}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Kutilmoqda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingStores}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stores list */}
        <Card>
          <CardHeader>
            <CardTitle>Barcha do'konlar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {stores?.map((store) => (
                  <div
                    key={store.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{store.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          /{store.slug} {store.city && `• ${store.city}`} {store.phone && `• ${store.phone}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={statusColors[store.store_status]}>
                        {statusLabels[store.store_status]}
                      </Badge>
                      <Badge variant="outline">{store.subscription_plan}</Badge>

                      <div className="flex gap-1 ml-2">
                        <Link to={`/store/${store.slug}`} target="_blank">
                          <Button variant="ghost" size="icon" title="Ko'rish">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {store.store_status !== 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Faollashtirish"
                            onClick={() => statusMutation.mutate({ storeId: store.id, status: 'active' })}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {store.store_status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="To'xtatish"
                            onClick={() => statusMutation.mutate({ storeId: store.id, status: 'suspended' })}
                          >
                            <Ban className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {stores?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Hali do'konlar yo'q
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
