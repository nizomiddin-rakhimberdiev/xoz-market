import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StoreProvider, useStoreContext } from '@/contexts/StoreContext';
import { StoreHeader } from '@/components/store/StoreHeader';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { ProductGrid } from '@/components/products/ProductGrid';
import { getCategories, getProducts } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2, AlertCircle, MapPin, Phone } from 'lucide-react';
import type { Product } from '@/types/database';

const PRODUCTS_PER_PAGE = 20;

function StoreContent() {
  const { store, isLoading: storeLoading, error: storeError } = useStoreContext();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [selectedCategory, searchQuery]);

  // Do'kon rangini qo'llash
  useEffect(() => {
    if (store?.theme_primary_color) {
      const hex = store.theme_primary_color;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      document.documentElement.style.setProperty('--primary', `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`);
    }
    return () => { document.documentElement.style.removeProperty('--primary'); };
  }, [store?.theme_primary_color]);

  useEffect(() => {
    if (store?.name) document.title = `${store.name} — Onlayn do'kon`;
    return () => { document.title = 'QurilishBozor'; };
  }, [store?.name]);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: () => getCategories(store!.id),
    enabled: !!store,
  });

  const { data: productsData, isLoading: productsLoading, isFetching } = useQuery({
    queryKey: ['products', store?.id, selectedCategory, searchQuery, page],
    queryFn: () => getProducts({
      storeId: store!.id,
      categoryId: selectedCategory || undefined,
      search: searchQuery || undefined,
      page,
      limit: PRODUCTS_PER_PAGE,
    }),
    enabled: !!store,
  });

  useEffect(() => {
    if (productsData?.products) {
      if (page === 1) {
        setAllProducts(productsData.products);
      } else {
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          return [...prev, ...productsData.products.filter(p => !existingIds.has(p.id))];
        });
      }
    }
  }, [productsData, page]);

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <AlertCircle className="w-14 h-14 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Do'kon topilmadi</h1>
          <p className="text-muted-foreground text-sm">Bu manzilda do'kon mavjud emas yoki faol emas.</p>
        </div>
      </div>
    );
  }

  const totalProducts = productsData?.total || 0;
  const hasMore = allProducts.length < totalProducts;

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />

      {/* Banner / Hero */}
      {store.banner_url ? (
        <div className="relative h-44 sm:h-56 md:h-72 overflow-hidden">
          <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
          {/* Kuchli gradient — matn ko'rinishi uchun */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-4 sm:pb-6 flex items-end gap-3">
            {store.logo_url && (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-white shadow-xl shrink-0"
              />
            )}
            <div className="min-w-0 pb-0.5">
              <h1 className="text-xl sm:text-3xl font-display font-bold text-white drop-shadow-md">
                {store.name}
              </h1>
              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1">
                {store.city && (
                  <span className="flex items-center gap-1 text-white/90 text-xs drop-shadow">
                    <MapPin className="w-3 h-3" />{store.city}
                  </span>
                )}
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="flex items-center gap-1 text-white/90 text-xs hover:text-white drop-shadow">
                    <Phone className="w-3 h-3" />{store.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/8 via-background to-background border-b border-border">
          <div className="container mx-auto px-4 py-6 sm:py-8 flex items-center gap-4">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover border border-border shadow-sm shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-primary">{store.name.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-bold truncate">{store.name}</h1>
              <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                {store.city && (
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <MapPin className="w-3 h-3" />{store.city}
                  </span>
                )}
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="flex items-center gap-1 text-primary text-xs hover:underline">
                    <Phone className="w-3 h-3" />{store.phone}
                  </a>
                )}
                {store.description && (
                  <span className="text-muted-foreground text-xs line-clamp-1">{store.description}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* Categories */}
        <CategoryFilter
          categories={categories || []}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          isLoading={categoriesLoading}
        />

        {/* Search result info */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            "<span className="text-foreground font-medium">{searchQuery}</span>" —{' '}
            {totalProducts} ta natija
          </p>
        )}

        {/* Products */}
        <ProductGrid
          products={allProducts}
          isLoading={productsLoading && page === 1}
          storeSlug={store.slug}
        />

        {/* Load more */}
        {hasMore && !productsLoading && (
          <div className="flex justify-center pt-4 pb-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              className="gap-2 rounded-full px-6"
              disabled={isFetching}
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              {isFetching ? 'Yuklanmoqda...' : 'Ko\'proq ko\'rsatish'}
            </Button>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-8 py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{store.name} — QurilishBozor platformasida</span>
          {store.phone && (
            <a href={`tel:${store.phone}`} className="hover:text-foreground transition-colors">{store.phone}</a>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function StoreFront() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider storeSlug={slug}>
      <StoreContent />
    </StoreProvider>
  );
}
