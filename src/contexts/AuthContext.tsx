import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { AppRole, Store } from '@/types/database';

interface AuthContextType {
  user: User | null;
  roles: AppRole[];
  userStore: Store | null;
  isLoading: boolean;
  isStoreOwner: boolean;
  isPlatformAdmin: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: [],
  userStore: null,
  isLoading: true,
  isStoreOwner: false,
  isPlatformAdmin: false,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [userStore, setUserStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const [roleResult, storeResult] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('stores').select('*').eq('owner_id', userId).maybeSingle(),
      ]);

      const userRoles = (roleResult.data?.map(r => r.role) || []) as AppRole[];

      if (storeResult.data && !userRoles.includes('store_owner')) {
        userRoles.push('store_owner');
      }

      setRoles(userRoles);
      setUserStore(storeResult.data ? (storeResult.data as Store) : null);
    } catch (err) {
      // Xato bo'lsa ham ilovani buzmaslik — faqat rollar bo'sh qoladi
      console.error('fetchUserData xatolik:', err);
      setRoles([]);
      setUserStore(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUserData(session.user.id);
      }
    } catch (err) {
      console.error('refreshAuth xatolik:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUser(session.user);
          await fetchUserData(session.user.id);
        }
      } catch (err) {
        console.error('Auth init xatolik:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setRoles([]);
        setUserStore(null);
      } else if (session?.user) {
        setUser(session.user);
        // fonda yuklaymiz — navigate ni bloklamaymiz
        fetchUserData(session.user.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles([]);
    setUserStore(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      roles,
      userStore,
      isLoading,
      isStoreOwner: roles.includes('store_owner'),
      isPlatformAdmin: roles.includes('platform_admin'),
      signOut,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
