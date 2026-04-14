import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Store } from '@/types/database';

interface StoreContextType {
  store: Store | null;
  isLoading: boolean;
  error: string | null;
  setStore: (store: Store | null) => void;
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  isLoading: false,
  error: null,
  setStore: () => {},
});

export function StoreProvider({ children, storeSlug }: { children: ReactNode; storeSlug?: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(!!storeSlug);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeSlug) return;

    const fetchStore = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .eq('is_active', true)
        .eq('store_status', 'active')
        .maybeSingle();

      if (fetchError) {
        setError('Do\'kon topilmadi');
      } else if (!data) {
        setError('Do\'kon topilmadi');
      } else {
        setStore(data as Store);
      }
      setIsLoading(false);
    };

    fetchStore();
  }, [storeSlug]);

  return (
    <StoreContext.Provider value={{ store, isLoading, error, setStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext() {
  return useContext(StoreContext);
}
