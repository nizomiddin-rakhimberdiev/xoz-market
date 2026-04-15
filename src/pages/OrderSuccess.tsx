import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, Phone, ArrowLeft, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StoreHeader } from '@/components/store/StoreHeader';
import { Button } from '@/components/ui/button';
import { useStoreContext } from '@/contexts/StoreContext';

export default function OrderSuccess({ storeSlug }: { storeSlug?: string }) {
  const location = useLocation();
  const orderNumber = location.state?.orderNumber;
  const base = storeSlug ? `/store/${storeSlug}` : '';
  const { store } = useStoreContext();

  const wrap = (children: React.ReactNode) => storeSlug ? (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">{children}</main>
    </div>
  ) : <MainLayout>{children}</MainLayout>;

  if (!orderNumber) {
    return <Navigate to={`${base}/`} replace />;
  }

  return wrap(
    <>
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold mb-4">
          Buyurtma qabul qilindi!
        </h1>

        <p className="text-muted-foreground mb-2">
          Buyurtma raqami:
        </p>
        <p className="text-2xl font-bold text-primary mb-6">
          {orderNumber}
        </p>

        <p className="text-muted-foreground mb-6">
          Tez orada operatorimiz siz bilan bog'lanadi va buyurtmani tasdiqlaydi.
        </p>

        {storeSlug && (
          <Link to={`${base}/order/${orderNumber}`} className="block mb-6">
            <Button variant="outline" className="w-full gap-2">
              <Search className="w-4 h-4" />
              Buyurtma holatini kuzatish
            </Button>
          </Link>
        )}

        {store?.phone && (
          <div className="bg-card rounded-2xl p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-3">Savollar bo'lsa:</p>
            <a
              href={`tel:${store.phone}`}
              className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
            >
              <Phone className="w-5 h-5" />
              {store.phone}
            </a>
          </div>
        )}

        <Link to={`${base}/`}>
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Bosh sahifaga qaytish
          </Button>
        </Link>
      </div>
    </>
  );
}
