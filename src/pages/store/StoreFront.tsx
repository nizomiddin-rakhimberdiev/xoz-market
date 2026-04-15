import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StoreProvider, useStoreContext } from '@/contexts/StoreContext';
import { StoreHeader } from '@/components/store/StoreHeader';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { ProductGrid } from '@/components/products/ProductGrid';
import { getCategories, getProducts } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2, AlertCircle } from 'lucide-react';
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
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
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
      const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      document.documentElement.style.setProperty('--primary', hsl);
    }
    return () => {
      document.documentElement.style.removeProperty('--primary');
    };
  }, [store?.theme_primary_color]);

  // SEO: sahifa sarlavhasi
  useEffect(() => {
    if (store?.name) {
      document.title = `${store.name} — Onlayn do'kon`;
    }
    return () => { document.title = 'QurilishBozor'; };
  }, [store?.name]);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: () => getCategories(store!.id),
    enabled: !!store,
  });

  const { data: productsData, isLoading: productsLoading, isFetching } = useQuery({
    queryKey: ['products', store?.id, selectedCategory, searchQuery, page],
    queryFn: () =>
      getProducts({
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
          const newProducts = productsData.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }
    }
  }, [productsData, page]);

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Do'kon topilmadi</h1>
          <p className="text-muted-foreground">
            Bu manzilda do'kon mavjud emas yoki faol emas.
          </p>
        </div>
      </div>
    );
  }

  const totalProducts = productsData?.total || 0;
  const hasMore = allProducts.length < totalProducts;

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Banner */}
          {store.banner_url && (
            <section className="relative rounded-2xl overflow-hidden">
              <img
                src={store.banner_url}
                alt={store.name}
                className="w-full h-32 sm:h-48 md:h-56 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-3">
                {store.logo_url && (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-background shadow-lg"
                  />
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">
                    {store.name}
                  </h1>
                  {store.description && (
                    <p className="text-muted-foreground text-xs sm:text-sm max-w-xl">
                      {store.description}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Hero (bannersiz) */}
          {!store.banner_url && (
            <section className="text-center py-4 sm:py-8 md:py-12">
              {store.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover mx-auto mb-4 border border-border"
                />
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-2 sm:mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                {store.name}ga xush kelibsiz!
              </h1>
              {store.description && (
                <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
                  {store.description}
                </p>
              )}
            </section>
          )}

          <section>
            <CategoryFilter
              categories={categories || []}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              isLoading={categoriesLoading}
            />
          </section>

          {searchQuery && (
            <div className="text-muted-foreground">
              "{searchQuery}" uchun <span className="font-semibold text-foreground">{totalProducts}</span> ta mahsulot topildi
            </div>
          )}

          <section>
            <ProductGrid products={allProducts} isLoading={productsLoading && page === 1} storeSlug={store.slug} />
          </section>

          {hasMore && !productsLoading && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPage((p) => p + 1)}
                className="gap-2"
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {isFetching ? 'Yuklanmoqda...' : 'Ko\'proq ko\'rsatish'}
              </Button>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              {store.name} — QurilishBozor platformasida
            </p>
            {store.phone && (
              <a href={`tel:${store.phone}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {store.phone}
              </a>
            )}
          </div>
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
