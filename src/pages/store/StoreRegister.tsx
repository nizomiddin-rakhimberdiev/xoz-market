import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StoreProvider } from '@/contexts/StoreContext';
import { StoreHeader } from '@/components/store/StoreHeader';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function StoreRegisterContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signUp, customer } = useCustomerAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', password: '', confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  if (customer) {
    navigate(`/store/${slug}/account`);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Parollar mos kelmaydi');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Parol kamida 6 ta belgi bo\'lishi kerak');
      return;
    }
    setIsLoading(true);
    const result = await signUp(form.phone, form.firstName, form.lastName, form.password);
    setIsLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
    navigate(`/store/${slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <StoreHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-sm mx-auto">
          <h1 className="text-2xl font-display font-bold mb-2 text-center">Ro'yxatdan o'tish</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Buyurtmalaringizni kuzatib boring
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ism</Label>
                <Input
                  placeholder="Ism"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Familiya</Label>
                <Input
                  placeholder="Familiya"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefon raqam</Label>
              <Input
                placeholder="+998 90 123 45 67"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Parol</Label>
              <Input
                type="password"
                placeholder="Kamida 6 ta belgi"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Parolni tasdiqlang</Label>
              <Input
                type="password"
                placeholder="Parolni qaytaring"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Allaqachon akkauntingiz bormi?{' '}
            <Link to={`/store/${slug}/login`} className="text-primary hover:underline font-medium">
              Kiring
            </Link>
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            <Link to={`/store/${slug}`} className="hover:underline">
              ← Do'konga qaytish
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function StoreRegister() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <StoreProvider storeSlug={slug}>
      <StoreRegisterContent />
    </StoreProvider>
  );
}
