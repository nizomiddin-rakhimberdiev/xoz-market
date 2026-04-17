import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StoreProvider, useStoreContext } from '@/contexts/StoreContext';
import { StoreHeader } from '@/components/store/StoreHeader';
import { ProductGrid } from '@/components/products/ProductGrid';
import { getCategories, getProducts } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/database';

const PRODUCTS_PER_PAGE = 20;

function StoreContent() {
  const { store, isLoading: storeLoading, error: storeError } = useStoreContext();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => { setPage(1); setAllProducts([]); }, [selectedCategory, searchQuery]);

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
      if (page === 1) setAllProducts(productsData.products);
      else setAllProducts(prev => {
        const ids = new Set(prev.map(p => p.id));
        return [...prev, ...productsData.products.filter(p => !ids.has(p.id))];
      });
    }
  }, [productsData, page]);

  if (storeLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (storeError || !store) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <AlertCircle className="w-14 h-14 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold">Do'kon topilmadi</h1>
        <p className="text-muted-foreground text-sm">Bu manzilda do'kon mavjud emas yoki faol emas.</p>
      </div>
    </div>
  );

  const totalProducts = productsData?.total || 0;
  const hasMore = allProducts.length < totalProducts;
  const activeCategories = categories || [];

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />

      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-4">

        {/* Banner */}
        {store.banner_url && (
          <div className="rounded-2xl overflow-hidden">
            <img
              src={store.banner_url}
              alt={store.name}
              className="w-full h-36 sm:h-52 md:h-64 object-cover"
            />
          </div>
        )}

        {/* Categories */}
        {(activeCategories.length > 0 || categoriesLoading) && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categoriesLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 w-24 rounded-full bg-secondary animate-pulse shrink-0" />
              ))
            ) : (
              <>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all border',
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  )}
                >
                  Hammasi
                </button>
                {activeCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-all border whitespace-nowrap',
                      selectedCategory === cat.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:border-primary/50'
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* Search result info */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            "<span className="text-foreground font-medium">{searchQuery}</span>" — {totalProducts} ta natija
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
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={() => setPage(p => p + 1)}
              className="gap-2 rounded-full px-8"
              disabled={isFetching}
            >
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              {isFetching ? 'Yuklanmoqda...' : "Ko'proq ko'rsatish"}
            </Button>
          </div>
        )}
      </div>

      <footer className="border-t border-border mt-6 py-5">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
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
