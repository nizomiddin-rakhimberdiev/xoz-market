import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  signIn: (phone: string, password: string) => Promise<{ error?: string }>;
  signUp: (phone: string, firstName: string, lastName: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

const SESSION_KEY = 'xoztovars-customer-token';

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    supabase.rpc('customer_get_profile', { p_token: token }).then(({ data }) => {
      if (data) setCustomer(data as Customer);
      else localStorage.removeItem(SESSION_KEY);
      setIsLoading(false);
    });
  }, []);

  const signIn = async (phone: string, password: string) => {
    const { data, error } = await supabase.rpc('customer_login', {
      p_phone: phone,
      p_password: password,
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    localStorage.setItem(SESSION_KEY, data.token);
    setCustomer(data.customer as Customer);
    return {};
  };

  const signUp = async (phone: string, firstName: string, lastName: string, password: string) => {
    const { data, error } = await supabase.rpc('customer_register', {
      p_phone: phone,
      p_first_name: firstName,
      p_last_name: lastName,
      p_password: password,
    });
    if (error) return { error: error.message };
    if (data?.error) return { error: data.error };
    localStorage.setItem(SESSION_KEY, data.token);
    setCustomer(data.customer as Customer);
    return {};
  };

  const signOut = async () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (token) await supabase.rpc('customer_logout', { p_token: token });
    localStorage.removeItem(SESSION_KEY);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, isLoading, signIn, signUp, signOut }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return ctx;
}
